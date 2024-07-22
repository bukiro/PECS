import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription, switchMap, distinctUntilChanged, shareReplay, combineLatest, map, of } from 'rxjs';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { SkillChoice } from 'src/app/classes/character-creation/skill-choice';
import { Creature } from 'src/app/classes/creatures/creature';
import { Speed } from 'src/app/classes/creatures/speed';
import { Effect } from 'src/app/classes/effects/effect';
import { Skill } from 'src/app/classes/skills/skill';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CreatureSensesService } from 'src/libs/shared/services/creature-senses/creature-senses.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { SpeedValuesService } from 'src/libs/shared/services/speed-values/speed-values.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { selectEffects } from 'src/libs/store/effects';
import { SkillChoiceComponent } from '../../../shared/skill-choice/components/skill-choice/skill-choice.component';
import { ObjectEffectsComponent } from '../../../shared/object-effects/components/object-effects/object-effects.component';
import { TagsComponent } from '../../../shared/tags/components/tags/tags.component';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SkillComponent } from '../../../shared/skill/components/skill/skill.component';
import { CommonModule } from '@angular/common';
import { CharacterSheetCardComponent } from '../../../shared/ui/character-sheet-card/character-sheet-card.component';


interface SpeedParameters {
    name: string;
    value: { result: number; explain: string };
    showPenalties: boolean;
    showBonuses: boolean;
    absolutes: Array<Effect>;
    relatives: Array<Effect>;
}

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbPopover,
        NgbTooltip,

        CharacterSheetCardComponent,
        SkillComponent,
        TagsComponent,
        ObjectEffectsComponent,
        SkillChoiceComponent,
    ],
})
export class SkillsComponent extends TrackByMixin(BaseCreatureElementComponent) implements OnInit, OnDestroy {

    public character$ = CreatureService.character$;

    public isMinimized$: Observable<boolean>;
    public isTileMode$: Observable<boolean>;

    private _showList = '';
    private _showAction = '';

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _speedValuesService: SpeedValuesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _creatureSensesService: CreatureSensesService,
        private readonly _store$: Store,
    ) {
        super();

        this.isMinimized$ = this.creature$
            .pipe(
                switchMap(creature => SettingsService.settings$
                    .pipe(
                        switchMap(settings => {
                            switch (creature.type) {
                                case CreatureTypes.AnimalCompanion:
                                    return settings.companionMinimized$;
                                case CreatureTypes.Familiar:
                                    return settings.familiarMinimized$;
                                default:
                                    return settings.skillsMinimized$;
                            }
                        }),
                    ),
                ),
                distinctUntilChanged(),
            );

        this.isTileMode$ = propMap$(SettingsService.settings$, 'skillsTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public get creature(): Creature {
        return super.creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._updateCreature(creature);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.creature.isCharacter();
    }

    public get stillLoading(): boolean {
        return this._skillsDataService.stillLoading;
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.setSetting(settings => { settings.skillsMinimized = minimized; });
    }

    public toggleTileMode(tileMode: boolean): void {
        SettingsService.setSetting(settings => { settings.skillsTileMode = tileMode; });
    }

    public toggleShownList(name: string): void {
        this._showList = this._showList === name ? '' : name;
    }

    public shownList(): string {
        return this._showList;
    }

    public toggleShownAction(id: string): void {
        this._showAction = this._showAction === id ? '' : id;
    }

    public shownAction(): string {
        return this._showAction;
    }

    public receiveShowActionMessage(id: string): void {
        this.toggleShownAction(id);
    }

    public receiveShowChoiceMessage(message: { name: string; levelNumber: number; choice?: SkillChoice }): void {
        this.toggleShownList(message.name);
    }

    public skillsOfType$(type: string): Observable<Array<Skill>> {
        return combineLatest([
            this.creature$,
            this.creature$
                .pipe(
                    switchMap(creature => creature.level$),
                ),
        ])

            .pipe(
                map(([creature, creatureLevel]) => this._skillsDataService
                    .skills(creature.customSkills, '', { type })
                    .filter(skill =>
                        skill.name.includes('Lore') ?
                            this._skillValuesService.level$(skill, creature, creatureLevel) :
                            true,
                    )
                    .sort((a, b) => sortAlphaNum(a.name, b.name))),
            );
    }

    public ownedActivities$(): Observable<Array<ActivityGain | ItemActivity>> {
        return combineLatest([
            this.creature$,
            propMap$(SettingsService.settings$, 'showSkillActivities$'),
        ])
            .pipe(
                switchMap(([creature, showSkillActivities]) =>
                    showSkillActivities
                        ? this._creatureActivitiesService.creatureOwnedActivities$(creature)
                            .pipe(
                                map(skillActivities => ({ skillActivities, creature })),
                            )
                        : of({ skillActivities: [], creature }),
                ),
                map(({ skillActivities, creature }) => {
                    const activities: Array<ActivityGain | ItemActivity> = [];
                    const unique: Array<string> = [];

                    skillActivities.forEach(activity => {
                        if (!unique.includes(activity.name)) {
                            unique.push(activity.name);
                            activities.push(activity);
                        }
                    });

                    activities
                        .forEach(gain => {
                            // Calculate the current cooldown for each activity, which is stored in a temporary variable.
                            this._activityPropertiesService
                                .effectiveCooldown$(gain.originalActivity, { creature });
                        });

                    return activities;
                }),
            );

    }

    public skillMatchingActivities(activities: Array<ActivityGain | ItemActivity>, skillName: string): Array<ActivityGain | ItemActivity> {
        //Filter activities whose showonSkill or whose original activity's showonSkill includes this skill's name.
        return activities.filter(gain =>
            (gain.originalActivity.showonSkill || '')
                .toLowerCase().includes(skillName.toLowerCase()),
        );
    }

    public senses$(): Observable<Array<string>> {
        return this.creature$
            .pipe(
                switchMap(creature =>
                    this._creatureSensesService.creatureSenses$(creature, undefined, true),
                ),
            );
    }

    public speedParameters$(): Observable<Array<SpeedParameters>> {
        return this.creature$
            .pipe(
                switchMap(creature =>
                    this._store$.select(selectEffects(creature.typeId))
                        .pipe(
                            map(effects => ({ creature, effects })),
                        ),
                ),
                map(({ creature, effects }) => ({
                    creature,
                    speedEffects: effects
                        //We don't process the values yet - for now we just collect all Speeds that are mentioned in effects.
                        // Since we pick up every effect that includes "Speed",
                        // but we don't want stuff like "Ignore Circumstance Penalties To Speed" to show up,
                        // we filter out "Ignore".
                        // Also skip those that are exactly "Speed", which should affect all speeds.
                        .filter(effect =>
                            effect.applied &&
                            !effect.toggled &&
                            effect.target.toLowerCase().includes('speed') &&
                            effect.target.toLowerCase() !== 'speed' &&
                            !effect.target.toLowerCase().includes('ignore'),
                        ),
                })),
                map(({ creature, speedEffects }) => {
                    const speeds: Array<Speed> = creature.speeds;

                    if (creature.isCharacter() || creature.isAnimalCompanion()) {
                        creature.class?.ancestry?.speeds?.forEach(speed => {
                            speeds.push(new Speed(speed.name));
                        });
                    }

                    speedEffects.forEach(effect => {
                        if (!speeds.some(speed => speed.name === effect.target)) {
                            speeds.push(new Speed(effect.target));
                        }
                    });

                    //Remove any duplicates for display
                    const uniqueSpeeds: Array<Speed> = [];

                    speeds.forEach(speed => {
                        if (!uniqueSpeeds.find(uniqueSpeed => uniqueSpeed.name === speed.name)) {
                            uniqueSpeeds.push(speed);
                        }
                    });

                    return { creature, uniqueSpeeds };
                }),
                switchMap(({ creature, uniqueSpeeds }) => emptySafeCombineLatest(
                    uniqueSpeeds
                        .map(speed => this._speedValuesService.calculate$(speed, creature))),
                ),
                map(speeds => speeds.filter(speed => !!speed.value.result)),
            );
    }

    public skillChoices$(): Observable<Array<SkillChoice> | undefined> {
        return combineLatest([
            this.creature$,
            CharacterFlatteningService.characterLevel$,
        ])
            .pipe(
                map(([creature, creatureLevel]) => {
                    if (creature.isCharacter()) {
                        const choices: Array<SkillChoice> = [];

                        creature.class.levels.filter(level => level.number <= creatureLevel).forEach(level => {
                            choices.push(...level.skillChoices.filter(choice => choice.showOnSheet));
                        });

                        return choices;
                    }
                }),
            );

    }

    public senseDesc(sense: string): string {
        switch (sense) {
            case 'Darkvision':
                return 'You can see in darkness and dim light just as well as you can see in bright light, '
                    + 'though your vision in darkness is in black and white.';
            case 'Greater Darkvision':
                return 'You can see in darkness and dim light just as well as you can see in bright light, '
                    + 'though your vision in darkness is in black and white. Some forms of magical darkness, '
                    + 'such as a 4th-level darkness spell, block normal darkvision. A creature with greater darkvision, '
                    + 'however, can see through even these forms of magical darkness.';
            case 'Low-Light Vision':
                return 'You can see in dim light as though it were bright light, and you ignore the concealed condition due to dim light.';
            default:
                if (sense.includes('Scent')) {
                    return 'You can use your sense of smell to determine the location of a creature, but it remains hidden.';
                }

                if (sense.includes('Tremorsense')) {
                    return 'You can feel the vibrations through a solid surface caused by movement.';
                }

                return '';
        }
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['skills', 'alls', this.creature.type.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.type.toLowerCase()
                    && ['skills', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
