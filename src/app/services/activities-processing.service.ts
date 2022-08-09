/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { Activity } from '../classes/Activity';
import { ActivityGain } from '../classes/ActivityGain';
import { ConditionGain } from '../classes/ConditionGain';
import { Creature } from '../classes/Creature';
import { Equipment } from '../classes/Equipment';
import { ItemActivity } from '../classes/ItemActivity';
import { ItemGain } from '../classes/ItemGain';
import { Rune } from '../classes/Rune';
import { SpellCast } from '../classes/SpellCast';
import { SpellTarget } from '../classes/SpellTarget';
import { WornItem } from '../classes/WornItem';
import { ActivitiesDataService } from '../core/services/data/activities-data.service';
import { ConditionsDataService } from '../core/services/data/conditions-data.service';
import { CharacterService } from './character.service';
import { ConditionGainPropertiesService } from '../../libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { EffectsService } from './effects.service';
import { ItemsService } from './items.service';
import { RefreshService } from './refresh.service';
import { SpellsService } from './spells.service';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesProcessingService {

    constructor(
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _refreshService: RefreshService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
    ) { }

    public activateActivity(
        creature: Creature,
        targetType: SpellTargetSelection,
        characterService: CharacterService,
        conditionGainPropertiesService: ConditionGainPropertiesService,
        itemsService: ItemsService,
        spellsService: SpellsService,
        gain: ActivityGain | ItemActivity,
        activity: Activity | ItemActivity,
        activated: boolean,
        changeAfter = true,
    ): void {
        // Find item, if it exists.
        const item: Equipment | Rune = this._activitiesDataService.itemFromActivityGain(creature, gain);

        if (item) { this._refreshService.prepareDetailToChange(creature.type, 'inventory'); }

        if (activity.hints.length) {
            this._refreshService.prepareChangesByHints(creature, activity.hints, { characterService });
        }

        this._refreshService.prepareDetailToChange(creature.type, 'activities');
        this._refreshService.prepareDetailToChange(creature.type, gain.id);

        const targets: Array<Creature | SpellTarget> = [];

        //In manual mode, targets, conditions, one time effects and spells are not processed, and targets are not needed.
        if (!characterService.isManualMode) {

            //Find out if target was given. If no target is set, conditions will not be applied.
            //Everything else (one time effects and gained items) automatically applies to the activating creature.
            switch (targetType) {
                case 'self':
                    targets.push(creature);
                    break;
                case CreatureTypes.Character:
                    targets.push(characterService.character);
                    break;
                case CreatureTypes.AnimalCompanion:
                    targets.push(characterService.companion);
                    break;
                case CreatureTypes.Familiar:
                    targets.push(characterService.familiar);
                    break;
                case 'Selected':
                    if (gain) {
                        targets.push(...gain.targets.filter(gainTarget => gainTarget.selected));
                    }

                    break;
                default: break;
            }
        }

        if (activated) {
            this._activateActivity(
                activity,
                {
                    creature,
                    targetType,
                    gain,
                    targets,
                    item,
                },
                {
                    characterService,
                    conditionGainPropertiesService,
                    itemsService,
                    spellsService,
                    effectsService: characterService.effectsService,
                },
            );
        } else {
            this._deactivateActivity(
                activity,
                {
                    creature,
                    gain,
                    targets,
                },
                {
                    characterService,
                    conditionGainPropertiesService,
                    itemsService,
                    spellsService,
                    effectsService: characterService.effectsService,
                },
            );
        }

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }
    }

    private _activateActivity(
        activity: Activity | ItemActivity,
        context: {
            creature: Creature;
            targetType: SpellTargetSelection;
            gain: ActivityGain | ItemActivity;
            targets: Array<Creature | SpellTarget>;
            item: Equipment | Rune;
        },
        services: {
            characterService: CharacterService;
            conditionGainPropertiesService: ConditionGainPropertiesService;
            itemsService: ItemsService;
            spellsService: SpellsService;
            effectsService: EffectsService;
        },
    ): void {
        if (activity.hints.length) {
            this._refreshService.prepareChangesByHints(context.creature, activity.hints, { characterService: services.characterService });
        }

        let shouldClosePopupsAfterActivation = false;

        // Start cooldown, unless one is already in effect.
        if (!context.gain.activeCooldown) {
            this._activityPropertiesService.cacheEffectiveCooldown(activity, context);

            if (activity.$cooldown) {
                context.gain.activeCooldown = activity.$cooldown;
            }
        }

        this._activityPropertiesService.cacheMaxCharges(activity, context);

        // Use charges
        const maxCharges = activity.$charges;

        if (maxCharges || context.gain.sharedChargesID) {
            // If this activity belongs to an item and has a sharedCharges ID,
            // spend a charge for every activity with the same sharedChargesID and start their cooldown if necessary.
            if (context.item && context.gain.sharedChargesID) {
                context.item.activities
                    .filter(itemActivity => itemActivity.sharedChargesID === context.gain.sharedChargesID)
                    .forEach(itemActivity => {
                        this._activityPropertiesService.cacheMaxCharges(itemActivity, context);

                        if (itemActivity.$charges) {
                            itemActivity.chargesUsed += 1;
                        }

                        this._activityPropertiesService.cacheEffectiveCooldown(itemActivity, context);

                        if (!itemActivity.activeCooldown && itemActivity.$cooldown) {
                            itemActivity.activeCooldown = itemActivity.$cooldown;
                        }
                    });
                context.item instanceof Equipment && context.item.gainActivities
                    .filter(gain => gain.sharedChargesID === context.gain.sharedChargesID)
                    .forEach(gain => {
                        const originalActivity = this._activityGainPropertyService.originalActivity(gain);

                        if (originalActivity.name === gain.name) {
                            this._activityPropertiesService.cacheMaxCharges(originalActivity, context);

                            if (originalActivity.$charges) {
                                gain.chargesUsed += 1;
                            }

                            this._activityPropertiesService.cacheEffectiveCooldown(originalActivity, context);

                            if (!gain.activeCooldown && originalActivity.$cooldown) {
                                gain.activeCooldown = originalActivity.$cooldown;
                            }
                        }

                    });
            } else if (maxCharges) {
                context.gain.chargesUsed += 1;
            }
        }

        //The conditions listed in conditionsToRemove will be removed after the activity is processed.
        const conditionsToRemove: Array<string> = [];

        if (activity.toggle) {
            context.gain.active = true;

            if (activity.maxDuration) {
                context.gain.duration = activity.maxDuration;
                //If an effect changes the duration of this activitiy, change the duration here.
                services.effectsService
                    .absoluteEffectsOnThis(context.creature, `${ activity.name } Duration`)
                    .forEach(effect => {
                        context.gain.duration = parseInt(effect.setValue, 10);
                        conditionsToRemove.push(effect.source);
                    });
                services.effectsService
                    .relativeEffectsOnThis(context.creature, `${ activity.name } Duration`)
                    .forEach(effect => {
                        context.gain.duration += parseInt(effect.value, 10);
                        conditionsToRemove.push(effect.source);
                    });
            }

            context.gain.selectedTarget = context.targetType;
        } else {
            context.gain.active = false;
            context.gain.duration = 0;
            context.gain.selectedTarget = '';
        }

        //Process various results of activating the activity

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (context.gain instanceof ActivityGain) {
                context.gain.gainItems = activity.gainItems.map(gainItem => Object.assign(new ItemGain(), gainItem).recast());
            }

            context.gain.gainItems.forEach(gainItem => {
                gainItem.grantGrantedItem(
                    context.creature,
                    { sourceName: activity.name },
                    { characterService: services.characterService, itemsService: services.itemsService },
                );
            });
        }

        //In manual mode, targets, conditions, one time effects and spells are not processed.
        if (!services.characterService.isManualMode) {

            //One time effects
            if (activity.onceEffects) {
                activity.onceEffects.forEach(effect => {
                    if (!effect.source) {
                        effect.source = activity.name;
                    }

                    services.characterService.processOnceEffect(context.creature, effect);
                });
            }

            //Apply conditions.
            //The condition source is the activity name.
            if (activity.gainConditions) {
                const isSlottedAeonStone = (context.item && context.item instanceof WornItem && context.item.isSlottedAeonStone);
                const conditions: Array<ConditionGain> =
                    activity.gainConditions.filter(conditionGain => conditionGain.resonant ? isSlottedAeonStone : true);
                const hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter !== 'caster');
                const hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter === 'caster');
                const isCasterATarget: boolean = context.targets.some(target => target.id === context.creature.id);
                //Do the target and the caster get the same condition?
                const isCasterConditionSameAsTargetCondition: boolean =
                    hasTargetCondition &&
                    hasCasterCondition &&
                    Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length === 1;

                conditions.forEach((conditionGain, conditionIndex) => {
                    conditionGain.source = activity.name;

                    const newConditionGain = Object.assign(new ConditionGain(), conditionGain).recast();
                    const condition = this._conditionsDataService.conditionFromName(conditionGain.name);

                    if (
                        condition.endConditions.some(endCondition =>
                            endCondition.name.toLowerCase() === context.gain.source.toLowerCase(),
                        )) {
                        // If any condition ends the condition that this activity came from,
                        // close all popovers after the activity is processed.
                        // This ensures that conditions in stickyPopovers don't remain open even after they have been removed.
                        shouldClosePopupsAfterActivation = true;
                    }

                    if (!newConditionGain.source) {
                        newConditionGain.source = activity.name;
                    }

                    //Unless the conditionGain has a choice set, try to set it by various factors.
                    if (!newConditionGain.choice) {
                        if (newConditionGain.copyChoiceFrom && context.gain.effectChoices.length) {
                            // If the gain has copyChoiceFrom set, use the choice from the designated condition.
                            // If there are multiple conditions with the same name, the first is taken.
                            newConditionGain.choice =
                                context.gain.effectChoices.find(choice => choice.condition === conditionGain.copyChoiceFrom)?.choice ||
                                condition.choice;
                        } else if (newConditionGain.choiceBySubType) {
                            // If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType,
                            // set the choice to that feat's subType as long as it's a valid choice for the condition.
                            const subType =
                                (
                                    services.characterService
                                        .characterFeatsAndFeatures(newConditionGain.choiceBySubType, '', true, true)
                                        .find(feat =>
                                            feat.superType === newConditionGain.choiceBySubType &&
                                            feat.have({ creature: context.creature }, { characterService: services.characterService }),
                                        )
                                );

                            if (subType && condition.choices.map(choice => choice.name).includes(subType.subType)) {
                                newConditionGain.choice = subType.subType;
                            }
                        } else if (context.gain.effectChoices.length) {
                            // If this condition has choices, and the activityGain has choices prepared, apply the choice from the gain.
                            // The order of gain.effectChoices maps directly onto the order of the conditions,
                            // no matter if they have choices.
                            if (condition.$choices.includes(context.gain.effectChoices[conditionIndex].choice)) {
                                newConditionGain.choice = context.gain.effectChoices[conditionIndex].choice;
                            }
                        }
                    }

                    //Under certain circumstances, don't grant caster conditions:
                    // - If there is a target condition, the caster is also a target,
                    //   and the caster and the targets get the same condition.
                    // - If there is a target condition, the caster is also a target, and the caster condition is purely informational.
                    // - If the spell is hostile, hostile caster conditions are disabled, the caster condition is purely informational,
                    //   and the spell allows targeting the caster
                    //   (which is always the case for hostile spells because they don't have target conditions).
                    // - If the spell is friendly, friendly caster conditions are disabled,
                    //   the caster condition is purely informational, and the spell allows targeting the caster
                    //   (otherwise, it must be assumed that the caster condition is necessary).
                    if (
                        !(
                            conditionGain.targetFilter === 'caster' &&
                            (
                                (
                                    hasTargetCondition &&
                                    isCasterATarget &&
                                    (
                                        isCasterConditionSameAsTargetCondition ||
                                        (
                                            !condition.alwaysApplyCasterCondition &&
                                            !condition.hasEffects() &&
                                            !condition.isChangeable()
                                        )
                                    )
                                ) ||
                                (
                                    (
                                        activity.isHostile() ?
                                            services.characterService.character.settings.noHostileCasterConditions :
                                            services.characterService.character.settings.noFriendlyCasterConditions
                                    ) &&
                                    (
                                        !condition.hasEffects() &&
                                        !condition.isChangeable() &&
                                        !activity.cannotTargetCaster
                                    )
                                )
                            )
                        )
                    ) {
                        newConditionGain.sourceGainID = context.gain?.id || '';

                        // If this activityGain has taken over a spell level from a spell condition,
                        // and the new condition is a spell condition itself, transfer the spell level to it.
                        if (condition.minLevel) {
                            newConditionGain.heightened = newConditionGain.heightened || context.gain.heightened || condition.minLevel;
                        }

                        if (newConditionGain.durationIsDynamic) {
                            //If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
                            newConditionGain.duration =
                                condition.defaultDuration(newConditionGain.choice, newConditionGain.heightened).duration;
                        }

                        if (
                            conditionGain.targetFilter === 'caster' &&
                            hasTargetCondition &&
                            isCasterATarget &&
                            !condition.alwaysApplyCasterCondition &&
                            !condition.isChangeable() &&
                            !condition.hasDurationEffects() &&
                            condition.hasInstantEffects()
                        ) {
                            // If the condition is only granted because it has instant effects,
                            // we set the duration to 0, so it can do its thing and then leave.
                            newConditionGain.duration = 0;
                        } else {
                            //Check if an effect changes the duration of this condition.
                            let effectDuration: number = newConditionGain.duration || 0;

                            services.effectsService
                                .absoluteEffectsOnThis(
                                    context.creature,
                                    `${ condition.name.replace(' (Originator)', '').replace(' (Caster)', '') } Duration`,
                                )
                                .forEach(effect => {
                                    effectDuration = parseInt(effect.setValue, 10);
                                    conditionsToRemove.push(effect.source);
                                });

                            if (effectDuration > 0) {
                                services.effectsService
                                    .relativeEffectsOnThis(
                                        context.creature,
                                        `${ condition.name.replace(' (Originator)', '').replace(' (Caster)', '') } Duration`,
                                    ).forEach(effect => {
                                        effectDuration += parseInt(effect.value, 10);
                                        conditionsToRemove.push(effect.source);
                                    });
                            }

                            // If an effect has changed the duration,
                            // use the effect duration unless it is shorter than the current duration.
                            if (effectDuration) {
                                if (effectDuration === TimePeriods.Permanent) {
                                    //Unlimited is longer than anything.
                                    newConditionGain.duration = TimePeriods.Permanent;
                                } else if (newConditionGain.duration !== TimePeriods.Permanent) {
                                    //Anything is shorter than unlimited.
                                    if (
                                        effectDuration < TimePeriods.Permanent &&
                                        newConditionGain.duration > TimePeriods.NoTurn &&
                                        newConditionGain.duration < TimePeriods.Day
                                    ) {
                                        //Until Rest and Until Refocus are usually longer than anything below a day.
                                        newConditionGain.duration = effectDuration;
                                    } else if (effectDuration > newConditionGain.duration) {
                                        // If neither are unlimited and the above is not true,
                                        // a higher value is longer than a lower value.
                                        newConditionGain.duration = effectDuration;
                                    }
                                }
                            }
                        }

                        if (condition.hasValue) {
                            //Apply effects that change the value of this condition.
                            let effectValue: number = newConditionGain.value || 0;

                            services.effectsService
                                .absoluteEffectsOnThis(context.creature, `${ condition.name } Value`)
                                .forEach(effect => {
                                    effectValue = parseInt(effect.setValue, 10);
                                    conditionsToRemove.push(effect.source);
                                });
                            services.effectsService
                                .relativeEffectsOnThis(context.creature, `${ condition.name } Value`)
                                .forEach(effect => {
                                    effectValue += parseInt(effect.value, 10);
                                    conditionsToRemove.push(effect.source);
                                });
                            newConditionGain.value = effectValue;
                        }

                        //#Experimental, not needed so far
                        //Add caster data, if a formula exists.
                        //  if (conditionGain.casterDataFormula) {
                        //      newConditionGain.casterData = characterService.effectsService
                        //          .get_ValueFromFormula(conditionGain.casterDataFormula, creature, characterService, conditionGain);
                        //  }
                        //#
                        let conditionTargets: Array<Creature | SpellTarget> = context.targets;

                        // Caster conditions are applied to the caster creature only. If the spell is durationDependsOnTarget,
                        // there are any foreign targets (whose turns don't end when the caster's turn ends)
                        // and it doesn't have a duration of X+1, add 2 for "until another character's turn".
                        // This allows the condition to persist until after the caster's last turn,
                        // simulating that it hasn't been the target's last turn yet.
                        if (conditionGain.targetFilter === 'caster') {
                            conditionTargets = [context.creature];

                            if (
                                activity.durationDependsOnTarget &&
                                context.targets.some(listTarget => listTarget instanceof SpellTarget) &&
                                newConditionGain.duration > 0 &&
                                !newConditionGain.durationDependsOnOther
                            ) {
                                newConditionGain.duration += TimePeriods.UntilOtherCharactersTurn;
                            }
                        }

                        //Apply to any targets that are your own creatures.
                        conditionTargets.filter(target => !(target instanceof SpellTarget)).forEach(target => {
                            this._creatureConditionsService.addCondition(target as Creature, newConditionGain, {}, { noReload: true });
                        });

                        //Apply to any non-creature targets whose ID matches your own creatures.
                        const creatures = services.characterService.allAvailableCreatures();

                        conditionTargets.filter(
                            target => target instanceof SpellTarget &&
                                creatures.some(listCreature => listCreature.id === target.id),
                        )
                            .forEach(target => {
                                this._creatureConditionsService.addCondition(
                                    services.characterService.creatureFromType(target.type),
                                    newConditionGain,
                                    {},
                                    { noReload: true },
                                );
                            });

                        //Send conditions to non-creature targets that aren't your own creatures.
                        if (conditionGain.targetFilter !== 'caster' && conditionTargets.some(target => target instanceof SpellTarget)) {
                            // For foreign targets (whose turns don't end when the caster's turn ends),
                            // if the spell is not durationDependsOnTarget, and it doesn't have a duration of X+1,
                            // add 2 for "until another character's turn".
                            // This allows the condition to persist until after the target's last turn,
                            // simulating that it hasn't been the caster's last turn yet.
                            if (
                                !activity.durationDependsOnTarget &&
                                newConditionGain.duration > 0 &&
                                !newConditionGain.durationDependsOnOther
                            ) {
                                newConditionGain.duration += TimePeriods.UntilOtherCharactersTurn;
                            }

                            services.characterService.sendConditionToPlayers(
                                conditionTargets.filter(target =>
                                    target instanceof SpellTarget &&
                                    !creatures.some(listCreature => listCreature.id === target.id),
                                ) as Array<SpellTarget>, newConditionGain,
                            );
                        }
                    }
                });
            }

            //Cast Spells
            if (activity.castSpells) {
                // For non-item activities, which are read-only, we have to store any temporary spell gain data
                // (like duration and targets) on the activity gain instead of the activity,
                // so we copy all spell casts (which include spell gains) to the activity gain.
                if (context.gain instanceof ActivityGain) {
                    context.gain.castSpells =
                        activity.castSpells
                            .map(spellCast =>
                                Object.assign<SpellCast, SpellCast>(new SpellCast(), JSON.parse(JSON.stringify(spellCast))).recast(),
                            );
                }

                context.gain.castSpells.forEach((cast, spellCastIndex) => {
                    const librarySpell = services.spellsService.spellFromName(cast.name);

                    if (librarySpell) {
                        if (context.gain.spellEffectChoices[spellCastIndex].length) {
                            cast.spellGain.effectChoices = context.gain.spellEffectChoices[spellCastIndex];
                        }

                        if (cast.overrideChoices.length) {
                            //If the SpellCast has overrideChoices, copy them to the SpellGain.
                            cast.spellGain.overrideChoices = JSON.parse(JSON.stringify(cast.overrideChoices));
                        }

                        if (cast.duration) {
                            cast.spellGain.duration = cast.duration;
                        }

                        cast.spellGain.selectedTarget = context.targetType;

                        services.characterService.spellsService.processSpell(
                            librarySpell,
                            true,
                            {
                                characterService: services.characterService,
                                itemsService: services.itemsService,
                                conditionGainPropertiesService: services.conditionGainPropertiesService,
                            },
                            {
                                creature: context.creature,
                                target: cast.spellGain.selectedTarget,
                                gain: cast.spellGain,
                                level: cast.level,
                                activityGain: context.gain,
                            },
                            { manual: true },
                        );
                    }
                });
            }

        }

        // Exclusive activity activation:
        // If you activate one activity of an Item that has an exclusiveActivityID,
        // deactivate the other active activities on it that have the same ID.
        if (context.item && activity.toggle && context.gain.exclusiveActivityID) {
            if (context.item.activities.length + (context.item instanceof Equipment && context.item.gainActivities).length > 1) {
                context.item instanceof Equipment &&
                    context.item.gainActivities
                        .filter((activityGain: ActivityGain) =>
                            activityGain !== context.gain &&
                            activityGain.active &&
                            activityGain.exclusiveActivityID === context.gain.exclusiveActivityID,
                        )
                        .forEach((activityGain: ActivityGain) => {
                            this.activateActivity(
                                context.creature,
                                context.creature.type,
                                services.characterService,
                                services.conditionGainPropertiesService,
                                services.itemsService,
                                services.spellsService,
                                activityGain,
                                this._activitiesDataService.activities(activityGain.name)[0],
                                false,
                                false,
                            );
                        });
                context.item.activities
                    .filter((itemActivity: ItemActivity) =>
                        itemActivity !== context.gain &&
                        itemActivity.active &&
                        itemActivity.exclusiveActivityID === context.gain.exclusiveActivityID,
                    )
                    .forEach((itemActivity: ItemActivity) => {
                        this.activateActivity(
                            context.creature,
                            context.creature.type,
                            services.characterService,
                            services.conditionGainPropertiesService,
                            services.itemsService,
                            services.spellsService,
                            itemActivity,
                            itemActivity,
                            false,
                            false,
                        );
                    });
            }
        }

        //All Conditions that have affected the duration of this activity or its conditions are now removed.
        if (conditionsToRemove.length) {
            this._creatureConditionsService.currentCreatureConditions(context.creature, {}, { readonly: true })
                .filter(conditionGain => conditionsToRemove.includes(conditionGain.name))
                .forEach(conditionGain => {
                    this._creatureConditionsService.removeCondition(context.creature, conditionGain, false);
                });
        }

        if (shouldClosePopupsAfterActivation) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'close-popovers');
        }
    }

    private _deactivateActivity(
        activity: Activity | ItemActivity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            targets: Array<Creature | SpellTarget>;
        },
        services: {
            characterService: CharacterService;
            conditionGainPropertiesService: ConditionGainPropertiesService;
            itemsService: ItemsService;
            spellsService: SpellsService;
            effectsService: EffectsService;
        },
    ): void {
        if (activity.hints.length) {
            this._refreshService.prepareChangesByHints(context.creature, activity.hints, { characterService: services.characterService });
        }

        if (activity.cooldownAfterEnd) {
            this._activityPropertiesService.cacheEffectiveCooldown(activity, context);

            // If the activity ends and cooldownAfterEnd is set, start the cooldown anew.
            if (activity.$cooldown) {
                context.gain.activeCooldown = activity.$cooldown;
            }
        }

        context.gain.active = false;
        context.gain.duration = 0;
        context.gain.selectedTarget = '';

        //Remove gained items
        if (activity.gainItems.length) {
            context.gain.gainItems.forEach(gainItem => {
                gainItem.dropGrantedItem(context.creature, {}, { characterService: services.characterService });
            });

            if (context.gain instanceof ActivityGain) {
                context.gain.gainItems = [];
            }
        }

        //In manual mode, targets, conditions, one time effects and spells are not processed.
        if (!services.characterService.isManualMode) {

            //Remove applied conditions.
            //The condition source is the activity name.
            if (activity.gainConditions) {
                activity.gainConditions.forEach(conditionGain => {
                    const conditionTargets: Array<Creature | SpellTarget> =
                        (conditionGain.targetFilter === 'caster' ? [context.creature] : context.targets);

                    conditionTargets
                        .filter(target => !(target instanceof SpellTarget))
                        .forEach((target: Creature) => {
                            this._creatureConditionsService.currentCreatureConditions(target, { name: conditionGain.name })
                                .filter(existingConditionGain =>
                                    existingConditionGain.source === conditionGain.source &&
                                    existingConditionGain.sourceGainID === (context.gain?.id || ''),
                                )
                                .forEach(existingConditionGain => {
                                    this._creatureConditionsService.removeCondition(target, existingConditionGain, false);
                                });
                        });
                    services.characterService.sendConditionToPlayers(
                        conditionTargets.filter(target => target instanceof SpellTarget) as Array<SpellTarget>, conditionGain, false,
                    );
                });
            }

            //Disable toggled spells
            if (activity.castSpells) {
                context.gain.castSpells.forEach(cast => {
                    const librarySpell = services.spellsService.spellFromName(cast.name);

                    if (librarySpell) {
                        if (cast.overrideChoices.length) {
                            //If the SpellCast has overrideChoices, copy them to the SpellGain.
                            cast.spellGain.overrideChoices = JSON.parse(JSON.stringify(cast.overrideChoices));
                        }

                        if (cast.duration) {
                            cast.spellGain.duration = cast.duration;
                        }

                        services.characterService.spellsService.processSpell(
                            librarySpell,
                            false,
                            {
                                characterService: services.characterService,
                                itemsService: services.itemsService,
                                conditionGainPropertiesService: services.conditionGainPropertiesService,
                            },
                            {
                                creature: context.creature,
                                target: cast.spellGain.selectedTarget,
                                gain: cast.spellGain,
                                level: cast.level,
                                activityGain: context.gain,
                            },
                            { manual: true },
                        );
                    }
                });

                if (context.gain instanceof ActivityGain) {
                    context.gain.castSpells = [];
                }
            }

        }
    }
}
