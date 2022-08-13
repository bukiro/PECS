import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { ItemsService } from 'src/app/services/items.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Character } from 'src/app/classes/Character';
import { ConditionGainPropertiesService } from 'src/libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { Condition } from 'src/app/classes/Condition';
import { Creature } from 'src/app/classes/Creature';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Equipment } from 'src/app/classes/Equipment';
import { WornItem } from 'src/app/classes/WornItem';
import { Rune } from 'src/app/classes/Rune';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellGain } from 'src/app/classes/SpellGain';
import { Spell } from 'src/app/classes/Spell';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Trait } from 'src/app/classes/Trait';
import { ActivitiesProcessingService } from 'src/libs/shared/services/activities-processing/activities-processing.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';

interface ActivityParameters {
    maxCharges: number;
    cooldown: number;
    disabled: string;
    activitySpell: ActivitySpellSet;
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
})
export class ActivityComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public activity: Activity | ItemActivity;
    @Input()
    public gain: ActivityGain | ItemActivity;
    @Input()
    public allowActivate = false;
    @Input()
    public isSubItem = false;
    @Input()
    public closeAfterActivation = false;

    public item: Equipment | Rune;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _traitsService: TraitsService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _itemsService: ItemsService,
        private readonly _conditionGainPropertiesService: ConditionGainPropertiesService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        public trackers: Trackers,
    ) { }

    public get isManualMode(): boolean {
        return this._characterService.isManualMode;
    }

    public get isResonant(): boolean {
        return (this.activity instanceof ItemActivity && this.activity.resonant);
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public activityParameters(): ActivityParameters {
        const creature = this._currentCreature();

        this._activityPropertiesService.cacheMaxCharges(this.activity, { creature });

        const maxCharges = this.activity.$charges;
        const hasTooManySlottedAeonStones =
            (
                this.item instanceof WornItem &&
                this.item.isSlottedAeonStone &&
                this._itemsService.hasTooManySlottedAeonStones(this._currentCreature())
            );
        const isResonantAllowed =
            (this.item && this.item instanceof WornItem && this.item.isSlottedAeonStone && !hasTooManySlottedAeonStones);

        this._activityPropertiesService.cacheEffectiveCooldown(this.activity, { creature });

        return {
            maxCharges,
            cooldown: this.activity.$cooldown,
            disabled: this.gain ? this._activityGainPropertyService.gainDisabledReason(this.gain, { creature, maxCharges }) : '',
            activitySpell: this._activitySpell(),
            tooManySlottedAeonStones: hasTooManySlottedAeonStones,
            resonantAllowed: isResonantAllowed,
        };
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
                { creature: this._currentCreature(), target, gain },
            );
        }

        this._refreshService.processPreparedChanges();
    }

    public onManualRestoreCharge(): void {
        this.gain.chargesUsed = Math.max(this.gain.chargesUsed - 1, 0);

        if (this.gain.chargesUsed === 0) {
            this.gain.activeCooldown = 0;
        }
    }

    public onManualEndCooldown(): void {
        this.gain.activeCooldown = 0;
        this.gain.chargesUsed = 0;
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsService.traitFromName(traitName);
    }

    public characterFeatsShowingHintsOnThis(activityName: string): Array<Feat> {
        if (activityName) {
            return this._characterService.characterFeatsShowingHintsOnThis(activityName)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    public conditionsShowingHintsOnThis(activityName: string): Array<{ gain: ConditionGain; condition: Condition }> {
        if (activityName) {
            return this._characterService.creatureConditionsShowingHintsOnThis(this._currentCreature(), activityName)
                .sort((a, b) => SortAlphaNum(a.condition.name, b.condition.name));
        } else {
            return [];
        }
    }

    public activitiesShowingHintsOnThis(
        objectName: string,
    ): Array<{ gain: ActivityGain | ItemActivity; activity: Activity | ItemActivity }> {
        if (objectName) {
            return this._creatureActivitiesService.creatureOwnedActivities(this._currentCreature())
                .map(gain => ({ gain, activity: this._activityGainPropertyService.originalActivity(gain) }))
                .filter(set =>
                    set.activity?.hints
                        .some(hint =>
                            hint.showon.split(',')
                                .some(showon =>
                                    showon.trim().toLowerCase() === objectName.toLowerCase(),
                                ),
                        ),
                )
                .sort((a, b) => SortAlphaNum(a.activity.name, b.activity.name));
        } else {
            return [];
        }
    }

    public fusedStances(): Array<{ gain: ItemActivity | ActivityGain; activity: Activity }> {
        const featData = this.character.class.filteredFeatData(0, 0, 'Fuse Stance')[0];

        if (featData) {
            return this._creatureActivitiesService.creatureOwnedActivities(this._currentCreature())
                .filter(gain => featData.valueAsStringArray('stances')?.includes(gain.name))
                .map(gain => ({ gain, activity: this._activityGainPropertyService.originalActivity(gain) }));
        } else {
            return [];
        }
    }

    public activityConditions(): Array<{ gain: ConditionGain; condition: Condition }> {
        // For all conditions that are included with this activity,
        // create an effectChoice on the gain and set it to the default choice, if any.
        // Add the name for later copyChoiceFrom actions.
        const conditionSets: Array<{ gain: ConditionGain; condition: Condition }> = [];
        const gain = this.gain;

        if (gain) {
            this.activity.gainConditions
                .map(conditionGain => ({
                    gain: conditionGain,
                    condition: this._conditionsDataService.conditionFromName(conditionGain.name),
                }))
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    this._conditionPropertiesService.cacheEffectiveChoices(
                        conditionSet.condition,
                        (conditionSet.gain.heightened ? conditionSet.gain.heightened : conditionSet.condition.minLevel),
                    );
                    // Add the condition to the selection list.
                    // Conditions with no choices, with hideChoices or with copyChoiceFrom will not be displayed.
                    conditionSets.push(conditionSet);

                    // Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices,
                    // insert or replace that choice on the gain.
                    while (conditionSet.condition && !gain.effectChoices.length || gain.effectChoices.length < index - 1) {
                        gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                    }

                    if (conditionSet.condition && !conditionSet.condition.$choices.includes(gain.effectChoices?.[index]?.choice)) {
                        gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                });
        }

        return conditionSets;
    }

    public shownConditionChoice(
        conditionSet: { gain: ConditionGain; condition: Condition },
        context: { tooManySlottedAeonStones: boolean; resonantAllowed: boolean },
    ): boolean {
        return this.allowActivate &&
            conditionSet.condition &&
            conditionSet.condition.$choices.length &&
            !conditionSet.gain.choiceBySubType &&
            !conditionSet.gain.choiceLocked &&
            !conditionSet.gain.copyChoiceFrom &&
            !conditionSet.gain.hideChoices &&
            !context.tooManySlottedAeonStones &&
            (conditionSet.gain.resonant ? context.resonantAllowed : true);
    }

    public onEffectChoiceChange(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        }

        this.item = this._activitiesDataService.itemFromActivityGain(this._currentCreature(), this.gain);
        this._subscribeToChanges();
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _currentCreature(creature: CreatureTypes = this.creature): Creature {
        return this._characterService.creatureFromType(creature);
    }

    private _activitySpell(): ActivitySpellSet {
        if (this.activity.castSpells.length) {
            const spell = this._spellFromName(this.activity.castSpells[0].name)[0];

            if (spell) {
                return { spell, gain: this.activity.castSpells[0].spellGain, cast: this.activity.castSpells[0] };
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    private _onActivateFuseStance(activated: boolean): void {
        this.gain.active = activated;
        this.fusedStances().forEach(set => {
            if (set.gain && set.activity && activated !== set.gain.active) {
                this._activitiesProcessingService.activateActivity(
                    set.activity,
                    activated,
                    {
                        creature: this._currentCreature(),
                        target: CreatureTypes.Character,
                        gain: set.gain,
                    },
                );
            }
        });
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    private _subscribeToChanges(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['activities', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['activities', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
