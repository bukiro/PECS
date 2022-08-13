import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { Character } from 'src/app/classes/Character';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Speed } from 'src/app/classes/Speed';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Skill } from 'src/app/classes/Skill';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { SpeedValuesService } from 'src/libs/shared/services/speed-values/speed-values.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';

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
})
export class SkillsComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;

    private _showList = '';
    private _showAction = '';

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertiesService: ActivityGainPropertiesService,
        private readonly _speedValuesService: SpeedValuesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return this._characterService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return this._characterService.character.settings.familiarMinimized;
            default:
                return this._characterService.character.settings.skillsMinimized;
        }
    }

    public get isTileMode(): boolean {
        return this._character.settings.skillsTileMode;
    }

    public get stillLoading(): boolean {
        return this._skillsDataService.stillLoading || this._characterService.stillLoading;
    }

    private get _character(): Character {
        return this._characterService.character;
    }

    private get _currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    public minimize(): void {
        this._characterService.character.settings.skillsMinimized = !this._characterService.character.settings.skillsMinimized;
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

    public receiveShowChoiceMessage(message: { name: string; levelNumber: number; choice: SkillChoice }): void {
        this.toggleShownList(message.name);
    }

    public toggleTileMode(): void {
        this._character.settings.skillsTileMode = !this._character.settings.skillsTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
        this._refreshService.processPreparedChanges();
    }

    public skillsOfType(type: string): Array<Skill> {
        const creature = this._currentCreature;

        return this._characterService.skills(creature, '', { type })
            .filter(skill =>
                skill.name.includes('Lore') ?
                    this._skillValuesService.level(skill, creature, creature.level) :
                    true,
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public ownedActivities(): Array<ActivityGain | ItemActivity> {
        const activities: Array<ActivityGain | ItemActivity> = [];
        const unique: Array<string> = [];

        if (this._character.settings.showSkillActivities) {
            this._creatureActivitiesService.creatureOwnedActivities(this._currentCreature).forEach(activity => {
                if (!unique.includes(activity.name)) {
                    unique.push(activity.name);
                    activities.push(activity);
                }
            });
        }

        activities
            .map(activity => this._activityGainPropertiesService.originalActivity(activity))
            .filter(originalActivity => !!originalActivity)
            .forEach(originalActivity => {
                // Calculate the current cooldown for each activity, which is stored in a temporary variable.
                this._activityPropertiesService.cacheEffectiveCooldown(originalActivity, { creature: this._currentCreature });
            });

        return activities;
    }

    public skillMatchingActivities(activities: Array<ActivityGain | ItemActivity>, skillName: string): Array<ActivityGain | ItemActivity> {
        //Filter activities whose showonSkill or whose original activity's showonSkill includes this skill's name.
        return activities.filter(activity =>
            (this._activityGainPropertiesService.originalActivity(activity)?.showonSkill || '')
                .toLowerCase().includes(skillName.toLowerCase()),
        );
    }

    public senses(): Array<string> {
        return this._characterService.creatureSenses(this._currentCreature, undefined, true);
    }

    public speedParameters(): Array<SpeedParameters> {
        return this.speeds().map(speed =>
            this._speedValuesService.calculate(speed, this._currentCreature),
        );
    }

    public speeds(): Array<Speed> {
        const speeds: Array<Speed> = this._characterService.creatureSpeeds(this._currentCreature);

        if ([CreatureTypes.Character, 'Companion'].includes(this._currentCreature.type)) {
            (this._currentCreature as Character).class?.ancestry?.speeds?.forEach(speed => {
                speeds.push(new Speed(speed.name));
            });
        }

        //We don't process the values yet - for now we just collect all Speeds that are mentioned in effects.
        // Since we pick up every effect that includes "Speed",
        // but we don't want "Ignore Circumstance Penalties To Speed" to show up, we filter out "Ignore".
        // Also skip those that are exactly "Speed", which should affect all speeds.
        const speedEffects = this._effectsService.effects(this.creature).all
            .filter(effect =>
                effect.apply &&
                !effect.toggle &&
                effect.target.toLowerCase().includes('speed') &&
                effect.target.toLowerCase() !== 'speed' &&
                !effect.target.toLowerCase().includes('ignore'));

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

        return uniqueSpeeds.filter(speed =>
            this._speedValuesService.value(speed, this._currentCreature).result !== 0,
        );
    }

    public skillChoices(): Array<SkillChoice> {
        if (this.creature === CreatureTypes.Character) {
            const character = (this._currentCreature as Character);
            const choices: Array<SkillChoice> = [];

            character.class.levels.filter(level => level.number <= character.level).forEach(level => {
                choices.push(...level.skillChoices.filter(choice => choice.showOnSheet));
            });

            return choices;
        }
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

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['skills', 'alls', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === this.creature.toLowerCase() && ['skills', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
