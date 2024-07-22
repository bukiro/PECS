import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription, Observable, combineLatest, of, map, switchMap, tap, take } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Trait } from 'src/app/classes/hints/trait';
import { Equipment } from 'src/app/classes/items/equipment';
import { Rune } from 'src/app/classes/items/rune';
import { WornItem } from 'src/app/classes/items/worn-item';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCast } from 'src/app/classes/spells/spell-cast';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { SpellTargetSelection } from 'src/libs/shared/definitions/types/spell-target-selection';
import { ActivitiesProcessingService } from 'src/libs/shared/processing/services/activities-processing/activities-processing.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { HintShowingObjectsService } from 'src/libs/shared/services/hint-showing-objects/hint-showing-objects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { ActionIconsComponent } from '../../../ui/action-icons/components/action-icons/action-icons.component';
import { DescriptionComponent } from '../../../ui/description/components/description/description.component';
import { ActivityContentComponent } from '../../../activity-content/components/activity-content/activity-content.component';
import { FormsModule } from '@angular/forms';
import { TagsComponent } from '../../../tags/components/tags/tags.component';
import { TraitComponent } from '../../../ui/trait/components/trait/trait.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SpellTargetComponent } from '../../../spell-target/components/spell-target/spell-target.component';
import { CommonModule } from '@angular/common';

interface ActivityParameters {
    maxCharges: number;
    cooldown: number;
    disabledReason: string;
    activitySpell?: ActivitySpellSet;
    tooManySlottedAeonStones: boolean;
    resonantAllowed: boolean;
}

interface ActivitySpellSet {
    spell: Spell;
    gain: SpellGain;
    cast: SpellCast;
}

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltip,

        SpellTargetComponent,
        TraitComponent,
        TagsComponent,
        ActivityContentComponent,
        DescriptionComponent,
        ActionIconsComponent,
    ],
})
export class ActivityComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: Creature = CreatureService.character;
    @Input()
    public activity!: Activity | ItemActivity;
    @Input()
    public gain?: ActivityGain | ItemActivity;
    @Input()
    public allowActivate?: boolean;
    @Input()
    public isSubItem?: boolean;
    @Input()
    public closeAfterActivation?: boolean;

    public item?: Equipment | Rune;

    public readonly isManualMode$ = SettingsService.settings.manualMode$;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _hintShowingObjectsService: HintShowingObjectsService,
    ) {
        super();
    }

    public get isResonant(): boolean {
        return (this.activity instanceof ItemActivity && this.activity.resonant);
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public activityParameters$(): Observable<ActivityParameters> {
        const creature = this.creature;

        const maxCharges$ = this._activityPropertiesService.effectiveMaxCharges$(this.activity, { creature });

        return combineLatest([
            maxCharges$,
            this._activityPropertiesService.effectiveCooldown$(this.activity, { creature }),
            this.gain
                ? this._activityGainPropertyService.disabledReason$(this.gain, { creature, maxCharges$ })
                : of(''),
        ])
            .pipe(
                map(([maxCharges, cooldown, disabledReason]) => {
                    const hasTooManySlottedAeonStones =
                        (
                            this.item instanceof WornItem &&
                            this.item.isSlottedAeonStone &&
                            creature.isCharacter() &&
                            creature.hasTooManySlottedAeonStones()
                        );
                    const isResonantAllowed =
                        !!(this.item && this.item instanceof WornItem && this.item.isSlottedAeonStone && !hasTooManySlottedAeonStones);

                    return {
                        maxCharges,
                        cooldown,
                        disabledReason,
                        activitySpell: this._activitySpell(),
                        tooManySlottedAeonStones: hasTooManySlottedAeonStones,
                        resonantAllowed: isResonantAllowed,
                    };
                }),
            );
    }

    public onActivate(
        gain: ActivityGain | ItemActivity,
        activity: Activity | ItemActivity,
        activated: boolean,
        target: SpellTargetSelection,
    ): void {
        if (gain.name === 'Fused Stance') {
            this._onActivateFuseStance(activated);
        } else {
            this._activitiesProcessingService.activateActivity(
                activity,
                activated,
                { creature: this.creature, target, gain },
            );
        }

        this._refreshService.processPreparedChanges();
    }

    public onManualRestoreCharge(): void {
        if (this.gain) {
            this.gain.chargesUsed = Math.max(this.gain.chargesUsed - 1, 0);

            if (this.gain.chargesUsed === 0) {
                this.gain.activeCooldown = 0;
            }
        }
    }

    public onManualEndCooldown(): void {
        if (this.gain) {
            this.gain.activeCooldown = 0;
            this.gain.chargesUsed = 0;
        }
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public characterFeatsShowingHintsOnThis$(activityName: string): Observable<Array<Feat>> {
        // Just in case the activity has no name, don't return all hint showing feats.
        if (activityName) {
            return this._hintShowingObjectsService.characterFeatsShowingHintsOnThis$(activityName)
                .pipe(
                    map(feats => feats.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    public conditionsShowingHintsOnThis(activityName: string): Array<{ gain: ConditionGain; condition: Condition }> {
        if (activityName) {
            return this._hintShowingObjectsService.creatureConditionsShowingHintsOnThis(this.creature, activityName)
                .sort((a, b) => sortAlphaNum(a.condition.name, b.condition.name));
        } else {
            return [];
        }
    }

    public activitiesShowingHintsOnThis$(
        activityName: string,
    ): Observable<Array<ActivityGain | ItemActivity>> {
        // If the activity has no name, save the effort of collecting activities since none will match.
        if (activityName) {
            return this._creatureActivitiesService.creatureOwnedActivities$(this.creature)
                .pipe(
                    map(gains =>
                        gains
                            .filter(gain =>
                                gain.originalActivity.hints
                                    .some(hint =>
                                        hint.showon.split(',')
                                            .some(showon =>
                                                showon.trim().toLowerCase() === activityName.toLowerCase(),
                                            ),
                                    ),
                            )
                            .sort((a, b) => sortAlphaNum(a.name, b.name)),
                    ),
                );
        } else {
            return of([]);
        }
    }

    public fusedStances$(): Observable<Array<ItemActivity | ActivityGain>> {
        return this.character.class.filteredFeatData$(0, 0, 'Fuse Stance')
            .pipe(
                switchMap(featData =>
                    featData[0]
                        ? this._creatureActivitiesService.creatureOwnedActivities$(this.creature)
                            .pipe(
                                map(gains =>
                                    gains.filter(gain => featData[0].valueAsStringArray('stances')?.includes(gain.name)),
                                ),
                            )
                        : of([]),
                ),
            );
    }

    public activityConditions$(): Observable<Array<{ gain: ConditionGain; condition: Condition; choices: Array<string> }>> {
        // For all conditions that are included with this activity,
        // create an effectChoice on the gain and set it to the default choice, if any.
        // Conditions with no choices, with hideChoices or with copyChoiceFrom will ultimately not be displayed.
        // Returns the sets of conditions with choices.

        const activityGain = this.gain;

        if (activityGain) {
            return emptySafeCombineLatest(
                this.activity.gainConditions
                    .map(conditionGain => ({
                        gain: conditionGain,
                        condition: this._conditionsDataService.conditionFromName(conditionGain.name),
                    }))
                    .map(conditionSet =>
                        this._conditionPropertiesService.effectiveChoices$(conditionSet.condition)
                            .pipe(
                                map(choices => ({
                                    gain: conditionSet.gain,
                                    condition: conditionSet.condition,
                                    choices,
                                })),
                            ),
                    ),
            )
                .pipe(
                    tap(conditionSets => {
                        conditionSets
                            .map(({ condition, choices }, index) => {
                                // Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices,
                                // insert or replace that choice on the gain.
                                while (condition && !activityGain.effectChoices.length || activityGain.effectChoices.length < index - 1) {
                                    activityGain.effectChoices.push({ condition: condition.name, choice: condition.choice });
                                }

                                if (condition && !choices.includes(activityGain.effectChoices?.[index]?.choice)) {
                                    activityGain.effectChoices[index] = { condition: condition.name, choice: condition.choice };
                                }
                            });
                    }),
                );
        } else {
            return of([]);
        }
    }

    public shownConditionChoice(
        conditionSet: { gain: ConditionGain; condition: Condition; choices: Array<string> },
        context: { tooManySlottedAeonStones: boolean; resonantAllowed: boolean },
    ): boolean {
        return !!this.allowActivate &&
            !!conditionSet.condition &&
            !!conditionSet.choices.length &&
            !conditionSet.gain.choiceBySubType &&
            !conditionSet.gain.choiceLocked &&
            !conditionSet.gain.copyChoiceFrom &&
            !conditionSet.gain.hideChoices &&
            !context.tooManySlottedAeonStones &&
            (conditionSet.gain.resonant ? context.resonantAllowed : true);
    }

    public onEffectChoiceChange(): void {
        this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature.type, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        }

        this.item = this._activitiesDataService.itemFromActivityGain(this.creature, this.gain);

        this._subscribeToChanges();
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _activitySpell(): ActivitySpellSet | undefined {
        if (this.activity.castSpells.length) {
            const spell = this._spellFromName(this.activity.castSpells[0].name);

            if (spell) {
                return { spell, gain: this.activity.castSpells[0].spellGain, cast: this.activity.castSpells[0] };
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    private _onActivateFuseStance(activated: boolean): void {
        if (this.gain) {
            this.gain.active = activated;
        }

        this.fusedStances$()
            .pipe(
                take(1),
            )
            .subscribe(fusedStances => {
                fusedStances
                    .forEach(gain => {
                        if (gain && gain.originalActivity && activated !== gain.active) {
                            this._activitiesProcessingService.activateActivity(
                                gain.originalActivity,
                                activated,
                                {
                                    creature: this.creature,
                                    target: CreatureTypes.Character,
                                    gain,
                                },
                            );
                        }
                    });
            });
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    private _subscribeToChanges(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (stringsIncludeCaseInsensitive(['activities', 'all', this.creature.type], target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature.type)
                    && stringsIncludeCaseInsensitive(['activities', 'all'], view.target)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
