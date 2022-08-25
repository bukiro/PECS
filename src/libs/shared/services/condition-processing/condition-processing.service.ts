import { Injectable } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { ActivitiesProcessingService } from 'src/libs/shared/services/activities-processing/activities-processing.service';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { Defaults } from '../../definitions/defaults';
import { ActivityGainPropertiesService } from '../activity-gain-properties/activity-gain-properties.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { EquipmentSpellsService } from '../equipment-spells/equipment-spells.service';
import { HealthService } from '../health/health.service';
import { SpellsTakenService } from '../spells-taken/spells-taken.service';
import { ItemGrantingService } from '../item-granting/item-granting.service';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { SpellProcessingService } from '../spell-processing/spell-processing.service';
import { CreatureActivitiesService } from '../creature-activities/creature-activities.service';
import { OnceEffectsService } from '../once-effects/once-effects.service';

@Injectable({
    providedIn: 'root',
})
export class ConditionProcessingService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _healthService: HealthService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _toastService: ToastService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _onceEffectsService: OnceEffectsService,
    ) { }

    public processCondition(
        creature: Creature,
        gain: ConditionGain,
        condition: Condition,
        taken: boolean,
        increaseWounded = true,
        ignoreEndsWithConditions = false,
    ): void {
        //Prepare components for refresh.
        if (condition.gainActivities.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'activities');
        }

        this._refreshService.prepareChangesByHints(creature, condition.hints);

        let didConditionDoAnything = false;
        let areOnceEffectsPrepared = false;

        //Copy the condition's ActivityGains to the ConditionGain so we can track its duration, cooldown etc.
        gain.gainActivities = condition.gainActivities
            .map(activityGain => activityGain.clone());

        //Process adding or removing other conditions.
        if (taken) {
            gain.maxDuration = gain.duration;

            //One time effects when adding or condition.
            const areGainEffectsPrepared = this._prepareConditionOneTimeEffects(creature, condition.onceEffects, condition, gain);
            //Remove other conditions if applicable.
            const areEndConditionsProcessed = this._processEndConditions(creature, condition, gain);
            //Gain other conditions if applicable
            //They are removed when this is removed.
            //This is done after all steps where conditions are removed, so we don't accidentally remove these newly gained conditions.
            const areGainConditionsProcessed = this._processGainConditions(creature, condition, gain);

            areOnceEffectsPrepared = areGainEffectsPrepared || areOnceEffectsPrepared;
            didConditionDoAnything =
                areGainEffectsPrepared ||
                areEndConditionsProcessed ||
                areGainConditionsProcessed ||
                didConditionDoAnything;
        } else {
            //One time effects when ending the condition.
            const areEndEffectsPrepared = this._prepareConditionOneTimeEffects(creature, condition.endEffects, condition, gain);
            //When this ends, remove conditions that have this listed in endsWithConditions.
            const areEndsWithConditionsProcessed = !ignoreEndsWithConditions && this._processEndsWithConditions(creature, condition, gain);
            //Conditions that start when this ends. This happens if there is a nextCondition value.
            const areNextConditionsProcessed = this._processNextConditions(creature, condition, gain);

            areOnceEffectsPrepared = areEndEffectsPrepared ? true : areOnceEffectsPrepared;
            didConditionDoAnything =
                areEndEffectsPrepared ||
                areEndsWithConditionsProcessed ||
                areNextConditionsProcessed ||
                didConditionDoAnything;
        }

        //Gain Items
        if (condition.gainItems.length) {
            const areGainItemsProcessed = this._processGainItems(creature, condition, gain, taken);

            didConditionDoAnything = areGainItemsProcessed || didConditionDoAnything;
        }

        //Stuff that happens when your Dying value is raised or lowered beyond a limit.
        if (gain.name === 'Dying') {
            didConditionDoAnything = true;

            this._processDyingCondition(creature, taken, increaseWounded);

            this._refreshService.prepareDetailToChange(creature.type, 'health');
        }

        //End the spell or activity causing this condition if there is one and it is active.
        if (!taken && gain.sourceGainID || gain.source) {
            this._endSourceSpellsAndActivities(creature, gain);
        }

        //Disable the condition's hints if deactivated.
        condition.hints.forEach(hint => hint.deactivateAll());

        //Some conditions have individual effects.
        const didNamedConditionsDoAnything = this._namedConditionEffects(creature, condition, gain, taken);

        didConditionDoAnything = didNamedConditionsDoAnything || didConditionDoAnything;

        this._prepareChanges(creature, condition, gain, areOnceEffectsPrepared);

        //Show a notification if a new condition has no duration and did nothing, because it will be removed in the next cycle.
        this._notifyOnUselessCondition(gain, taken, didConditionDoAnything);

    }

    private _prepareConditionOneTimeEffects(
        creature: Creature,
        effects: Array<EffectGain>,
        condition: Condition,
        gain: ConditionGain,
    ): boolean {
        let areOnceEffectsPrepared = false;

        //One time effects when adding the condition.
        effects.forEach(effect => {
            const tempEffect = effect.clone();

            //Copy some data to allow calculations and tracking temporary HP.
            if (!tempEffect.source) {
                tempEffect.source = condition.name;
                tempEffect.sourceId = gain.id;
            }

            if (!tempEffect.spellSource) {
                tempEffect.spellSource = gain.spellSource;
            }

            this._onceEffectsService.prepareOnceEffect(
                creature,
                tempEffect,
                gain.value,
                gain.heightened,
                gain.choice,
                gain.spellCastingAbility,
            );

            areOnceEffectsPrepared = true;
        });

        return areOnceEffectsPrepared;
    }

    private _processEndConditions(creature: Creature, condition: Condition, gain: ConditionGain): boolean {
        let areEndConditionsProcessed = false;

        condition.endConditions.forEach(end => {
            this._creatureConditionsService.currentCreatureConditions(creature, { name: end.name })
                .filter(conditionGain =>
                    conditionGain !== gain &&
                    (
                        !end.sameCasterOnly ||
                        (
                            conditionGain.foreignPlayerId === gain.foreignPlayerId
                        )
                    ),
                )
                .forEach(conditionGain => {
                    this._creatureConditionsService.removeCondition(creature, conditionGain, false, end.increaseWounded);
                });

            areEndConditionsProcessed = true;
        });

        return areEndConditionsProcessed;
    }

    private _processEndsWithConditions(creature: Creature, condition: Condition, gain: ConditionGain): boolean {
        let areEndsWithConditionsProcessed = false;

        this._creatureConditionsService.currentCreatureConditions(creature)
            .filter(conditionGain =>
                this._conditionsDataService.conditionFromName(conditionGain.name).endsWithConditions
                    .some(endsWith => endsWith.name === condition.name && (!endsWith.source || gain.source === endsWith.source)),
            )
            .map(conditionGain => conditionGain.clone())
            .forEach(conditionGain => {
                areEndsWithConditionsProcessed = true;
                this._creatureConditionsService.removeCondition(creature, conditionGain, false);
            });

        return areEndsWithConditionsProcessed;
    }

    private _processNextConditions(creature: Creature, condition: Condition, gain: ConditionGain): boolean {
        let areNextConditionsProcessed = false;

        condition.nextCondition.forEach(nextCondition => {
            if (!nextCondition.conditionChoiceFilter.length || nextCondition.conditionChoiceFilter.includes(gain.choice)) {
                areNextConditionsProcessed = true;

                const newGain: ConditionGain = new ConditionGain();

                newGain.source = gain.source;
                newGain.name = nextCondition.name;
                newGain.duration = nextCondition.duration || -1;
                newGain.choice = nextCondition.choice || this._conditionsDataService.conditionFromName(newGain.name)?.choice || '';
                this._creatureConditionsService.addCondition(creature, newGain, {}, { noReload: true });
            }
        });

        return areNextConditionsProcessed;
    }

    private _processGainConditions(creature: Creature, condition: Condition, gain: ConditionGain): boolean {
        let areGainConditionsProcessed = false;

        condition.gainConditions
            .filter(extraCondition =>
                !extraCondition.conditionChoiceFilter.length ||
                extraCondition.conditionChoiceFilter.includes(gain.choice),
            )
            .forEach(extraCondition => {
                areGainConditionsProcessed = true;

                const addCondition = extraCondition.clone();

                if (!addCondition.heightened) {
                    addCondition.heightened = gain.heightened;
                }

                addCondition.source = gain.name;
                addCondition.parentID = gain.id;
                addCondition.apply = true;
                this._creatureConditionsService.addCondition(creature, addCondition, { parentConditionGain: gain }, { noReload: true });

            });

        return areGainConditionsProcessed;
    }

    private _processGainItems(creature: Creature, condition: Condition, gain: ConditionGain, taken: boolean): boolean {
        let areGainItemsProcessed = false;

        if (condition.gainItems.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');

            if (taken) {
                gain.gainItems = condition.heightenedItemGains(gain.heightened)
                    .map(itemGain => itemGain.clone());
                gain.gainItems
                    .filter(gainItem =>
                        !gainItem.conditionChoiceFilter.length ||
                        gainItem.conditionChoiceFilter.includes(gain.choice),
                    ).forEach(gainItem => {
                        areGainItemsProcessed = true;
                        this._itemGrantingService.grantGrantedItem(
                            gainItem,
                            creature,
                            { sourceName: condition.name },
                        );
                    });
            } else {
                gain.gainItems
                    .filter(gainItem =>
                        !gainItem.conditionChoiceFilter.length ||
                        gainItem.conditionChoiceFilter.includes(gain.choice),
                    ).forEach(gainItem => {
                        this._itemGrantingService.dropGrantedItem(gainItem, creature);
                    });
                gain.gainItems = [];
            }
        }

        return areGainItemsProcessed;
    }

    private _processDyingCondition(creature: Creature, taken: boolean, increaseWounded: boolean): void {
        if (taken) {
            if (this._healthService.dying(creature) >= this._healthService.maxDying(creature)) {
                if (!this._creatureConditionsService.currentCreatureConditions(creature, { name: 'Dead' }).length) {
                    this._creatureConditionsService.addCondition(
                        creature,
                        Object.assign(new ConditionGain(), { name: 'Dead', source: 'Dying value too high' }).recast(),
                        {},
                        { noReload: true },
                    );
                }
            }
        } else {
            if (this._healthService.dying(creature) === 0) {
                if (increaseWounded) {
                    if (this._healthService.wounded(creature) > 0) {
                        this._creatureConditionsService.currentCreatureConditions(creature, { name: 'Wounded' })
                            .forEach(existingGain => {
                                existingGain.value++;
                                existingGain.source = 'Recovered from Dying';
                            });
                    } else {
                        this._creatureConditionsService.addCondition(
                            creature,
                            Object.assign(new ConditionGain(), { name: 'Wounded', value: 1, source: 'Recovered from Dying' }).recast(),
                            {},
                            { noReload: true },
                        );
                    }
                }

                if (!this._healthService.currentHP(creature.health, creature).result) {
                    if (
                        !this._creatureConditionsService
                            .currentCreatureConditions(creature, { name: 'Unconscious', source: '0 Hit Points' })
                            .length &&
                        !this._creatureConditionsService
                            .currentCreatureConditions(creature, { name: 'Unconscious', source: 'Dying' })
                            .length
                    ) {
                        this._creatureConditionsService.addCondition(
                            creature,
                            Object.assign(new ConditionGain(), { name: 'Unconscious', source: '0 Hit Points' }).recast(),
                            {},
                            { noReload: true },
                        );
                    }
                }
            }
        }
    }

    private _endSourceSpellsAndActivities(creature: Creature, gain: ConditionGain): void {
        const character = this._characterService.character;

        //If no other conditions have this ConditionGain's sourceGainID, find the matching SpellGain or ActivityGain and disable it.
        if (
            !this._creatureConditionsService.currentCreatureConditions(character)
                .some(conditionGain => conditionGain !== gain && conditionGain.sourceGainID === gain.sourceGainID)
        ) {
            this._spellsTakenService
                .takenSpells(character, 0, Defaults.maxCharacterLevel)
                .concat(this._equipmentSpellsService.allGrantedEquipmentSpells(character))
                .filter(takenSpell => takenSpell.gain.id === gain.sourceGainID && takenSpell.gain.active)
                .forEach(takenSpell => {
                    const spell = this._spellsDataService.spellFromName(takenSpell.gain.name);

                    if (spell) {
                        this._spellProcessingService.processSpell(
                            spell,
                            false,
                            { creature, target: takenSpell.gain.selectedTarget, gain: takenSpell.gain, level: 0 },
                        );
                    }

                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                });

            this._creatureActivitiesService.creatureOwnedActivities(creature, Defaults.maxCharacterLevel, true)
                .filter(activityGain => activityGain.id === gain.sourceGainID && activityGain.active)
                .forEach(activityGain => {
                    const activity: Activity | ItemActivity = this._activityGainPropertyService.originalActivity(activityGain);

                    if (activity) {
                        this._activitiesProcessingService.activateActivity(
                            activity,
                            false,
                            {
                                creature,
                                target: activityGain.selectedTarget,
                                gain: activityGain,
                            },
                        );
                    }

                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
                });

            //TO-DO: Test if the matching activity is always ended even without the below code.

            /* const activityGains = this._characterService.creatureOwnedActivities(creature, creature.level, true)
                .filter(activityGain => activityGain.active && activityGain.name === gain.source);

            if (activityGains.length) {
                let activityGain: ActivityGain;

                //Try to find the activity with the same duration as the condition. If there isn't one, end the first one.
                if (activityGains.length > 1) {
                    activityGain = activityGains.find(existingGain => existingGain.duration === gain.duration);
                }

                if (!activityGain) {
                    activityGain = activityGains[0];
                }

                const activity: Activity | ItemActivity = this._activityGainPropertyService.originalActivity(activityGain);

                if (activity) {
                    this._activitiesProcessingService
                        .activateActivity(
                            creature,
                            '',
                            this._characterService,
                            this._conditionGainPropertiesService,
                            this._itemsService,
                            this._spellsService,
                            activityGain,
                            activity,
                            false,
                            false,
                        );
                }
            } */
        }
    }

    private _namedConditionEffects(creature, condition: Condition, gain: ConditionGain, taken: boolean): boolean {
        let didNamedConditionsDoAnything = false;

        //Leave cover behind shield if the Cover condition is removed.
        if (condition.name === 'Cover' && (!taken || (gain.choice !== 'Greater'))) {
            this._creatureEquipmentService.equippedCreatureShield(creature).forEach(shield => {
                if (shield.takingCover) {
                    shield.takingCover = false;
                    this._refreshService.prepareDetailToChange(creature.type, 'defense');

                    didNamedConditionsDoAnything = true;
                }
            });
        }

        return didNamedConditionsDoAnything;
    }

    private _prepareChanges(creature: Creature, condition: Condition, gain: ConditionGain, areOnceEffectsPrepared: boolean): void {
        //If one-time-Effects are prepared, effects should be generated. Prepared one-time-effects get processed after effects generation.
        if (areOnceEffectsPrepared) {
            this._refreshService.prepareDetailToChange(creature.type, 'effects');
        }

        //Changing senses should update senses.
        if (condition.senses.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'skills');
        }

        //Update Health when Wounded changes.
        if (condition.name === 'Wounded') {
            this._refreshService.prepareDetailToChange(creature.type, 'health');
        }

        //Update Attacks when Hunt Prey or Flurry changes.
        if (['Hunt Prey', 'Hunt Prey: Flurry'].includes(condition.name)) {
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
        }

        //Update Attacks if attack restrictions apply.
        if (condition.attackRestrictions.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
        }

        //Update Defense if Defense conditions are changed.
        if (gain.source === 'Defense') {
            this._refreshService.prepareDetailToChange(creature.type, 'defense');
        }

        //Update Time and Health if the condition needs attention.
        if (gain.durationIsInstant) {
            this._refreshService.prepareDetailToChange(creature.type, 'time');
            this._refreshService.prepareDetailToChange(creature.type, 'health');
        }
    }

    private _notifyOnUselessCondition(gain: ConditionGain, taken: boolean, didConditionDoAnything: boolean): void {
        if (taken && !didConditionDoAnything && gain.duration === 0) {
            this._toastService.show(
                `The condition <strong>${ gain.name }</strong> was removed because it had no duration and no effect.`,
            );
        }
    }

}
