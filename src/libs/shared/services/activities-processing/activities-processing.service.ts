import { Injectable } from '@angular/core';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ItemGain } from 'src/app/classes/ItemGain';
import { Rune } from 'src/app/classes/Rune';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { WornItem } from 'src/app/classes/WornItem';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { SpellProcessingService } from 'src/libs/shared/services/spell-processing/spell-processing.service';
import { SpellTargetService } from 'src/libs/shared/services/spell-target/spell-target.service';
import { SpellActivityProcessingSharedService } from 'src/libs/shared/services/spell-activity-processing-shared/spell-activity-processing-shared.service';

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
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _characterService: CharacterService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _spellTargetService: SpellTargetService,
        private readonly _spellActivityProcessingSharedService: SpellActivityProcessingSharedService,

    ) { }

    public activateActivity(
        activity: Activity | ItemActivity,
        activated: boolean,
        context: {
            creature: Creature;
            target?: SpellTargetSelection;
            gain: ActivityGain | ItemActivity;
        },
    ): void {
        // Find item, if it exists.
        const item: Equipment | Rune = this._activitiesDataService.itemFromActivityGain(context.creature, context.gain);

        if (item) { this._refreshService.prepareDetailToChange(context.creature.type, 'inventory'); }

        if (activity.hints.length) {
            this._refreshService.prepareChangesByHints(context.creature, activity.hints);
        }

        this._refreshService.prepareDetailToChange(context.creature.type, 'activities');
        this._refreshService.prepareDetailToChange(context.creature.type, context.gain.id);

        const targets: Array<Creature | SpellTarget> = this._spellTargetService.determineTargetsFromSpellTarget(context.target, context);

        if (activated) {
            this._activateActivity(
                activity,
                {
                    ...context,
                    targets,
                    item,
                },
            );
        } else {
            this._deactivateActivity(
                activity,
                {
                    ...context,
                    targets,
                },
            );
        }
    }

    private _activateActivity(
        activity: Activity | ItemActivity,
        context: {
            creature: Creature;
            target?: SpellTargetSelection;
            gain: ActivityGain | ItemActivity;
            targets: Array<Creature | SpellTarget>;
            item: Equipment | Rune;
        },
    ): void {
        if (activity.hints.length) {
            this._refreshService.prepareChangesByHints(context.creature, activity.hints);
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
        this._useActivityCharges(activity, context);

        //The conditions listed in conditionsToRemove will be removed after the activity is processed.
        const conditionsToRemove: Array<string> = [];

        if (activity.toggle) {
            //Determine the toggled activity's duration and save the names of the conditions that influenced it.
            //TO-DO: Check if this properly changes the gain's attributes.
            conditionsToRemove.push(...this._activateToggledActivity(activity, context));
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
                this._itemGrantingService.grantGrantedItem(
                    gainItem,
                    context.creature,
                    { sourceName: activity.name },
                );
            });
        }

        //In manual mode, targets, conditions, one time effects and spells are not processed.
        if (!this._characterService.isManualMode) {

            //One time effects
            if (activity.onceEffects) {
                activity.onceEffects.forEach(effect => {
                    if (!effect.source) {
                        effect.source = activity.name;
                    }

                    this._characterService.processOnceEffect(context.creature, effect);
                });
            }

            //Apply conditions and save the names of the conditions that influenced their duration.
            if (activity.gainConditions) {
                const isSlottedAeonStone = (context.item && context.item instanceof WornItem && context.item.isSlottedAeonStone);
                const conditions: Array<ConditionGain> =
                    activity.gainConditions.filter(conditionGain => conditionGain.resonant ? isSlottedAeonStone : true);

                const gainingConditionsResult = this._applyGainingConditions(
                    activity,
                    conditions,
                    {
                        ...context,
                        targets: context.targets,
                    },
                );

                conditionsToRemove.push(
                    ...gainingConditionsResult.conditionsToRemove,
                );

                shouldClosePopupsAfterActivation =
                    gainingConditionsResult.shouldClosePopupsAfterActivation || shouldClosePopupsAfterActivation;


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
                    const librarySpell = this._spellsDataService.spellFromName(cast.name);

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

                        cast.spellGain.selectedTarget = context.target;

                        this._spellProcessingService.processSpell(
                            librarySpell,
                            true,
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

        this._deactivateExclusiveActivities(activity, context);

        //All Conditions that have affected the duration of this activity or its conditions are now removed.
        this._spellActivityProcessingSharedService.removeConditionsToRemove(conditionsToRemove, context);

        if (shouldClosePopupsAfterActivation) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'close-popovers');
        }
    }

    private _useActivityCharges(
        activity: Activity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            item: Equipment | Rune;
        },
    ): void {
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
    }

    /**
     * For a toggled activity, activate the activityGain and set its duration properly.
     * The duration can be influenced by condition effects.
     *
     * Returns the names of the conditions that should be removed after they changed the sustain duration.
     */
    private _activateToggledActivity(
        activity: Activity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            target?: SpellTargetSelection;
        },
    ): Array<string> {
        const conditionsToRemove: Array<string> = [];

        context.gain.active = true;

        if (activity.maxDuration) {
            context.gain.duration = activity.maxDuration;
            //If an effect changes the duration of this activitiy, change the duration here.
            this._effectsService
                .absoluteEffectsOnThis(context.creature, `${ activity.name } Duration`)
                .forEach(effect => {
                    context.gain.duration = parseInt(effect.setValue, 10);
                    conditionsToRemove.push(effect.source);
                });
            this._effectsService
                .relativeEffectsOnThis(context.creature, `${ activity.name } Duration`)
                .forEach(effect => {
                    context.gain.duration += parseInt(effect.value, 10);
                    conditionsToRemove.push(effect.source);
                });
        }

        context.gain.selectedTarget = context.target;

        return conditionsToRemove;
    }

    private _applyGainingConditions(
        activity: Activity,
        conditions: Array<ConditionGain>,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            item: Equipment | Rune;
            targets: Array<Creature | SpellTarget>;
        },
    ): { conditionsToRemove: Array<string>; shouldClosePopupsAfterActivation: boolean } {
        const conditionsToRemove: Array<string> = [];
        let shouldClosePopupsAfterActivation = false;

        const hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter !== 'caster');
        const hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter === 'caster');
        const isCasterATarget: boolean = context.targets.some(target => target.id === context.creature.id);
        //Do the target and the caster get the same condition?
        const isCasterConditionSameAsTargetCondition: boolean =
            hasTargetCondition &&
            hasCasterCondition &&
            Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length === 1;

        conditions.forEach((conditionGain, conditionIndex) => {
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

            //Unless preset, the condition source is the activity name.
            if (!newConditionGain.source) {
                newConditionGain.source = activity.name;
            }

            //Under certain circumstances, don't grant a condition.
            if (
                this._spellActivityProcessingSharedService._shouldGainCondition(
                    activity,
                    newConditionGain,
                    condition,
                    { hasTargetCondition, isCasterATarget, isCasterConditionSameAsTargetCondition },
                )
            ) {
                newConditionGain.sourceGainID = context.gain?.id || '';

                // If this activityGain has taken over a spell level from a spell condition,
                // and the new condition is a spell condition itself, transfer the spell level to it.
                if (condition.minLevel) {
                    newConditionGain.heightened = newConditionGain.heightened || context.gain.heightened || condition.minLevel;
                }

                //Unless the conditionGain has a choice set, try to set it by various factors.
                if (!newConditionGain.choice) {
                    this._spellActivityProcessingSharedService.determineGainedConditionChoice(
                        newConditionGain,
                        conditionIndex,
                        condition,
                        context,
                    );
                }

                //Determine the condition's duration and save the names of the conditions that influenced it.
                conditionsToRemove.push(
                    ...this._spellActivityProcessingSharedService.determineGainedConditionDuration(
                        newConditionGain,
                        condition,
                        { ...context, source: activity },
                        { hasTargetCondition, isCasterATarget },
                    ),
                );

                if (condition.hasValue) {
                    conditionsToRemove.push(
                        //Determine the condition's value and save the names of the conditions that influenced it.
                        ...this._spellActivityProcessingSharedService.determineGainedConditionValue(
                            newConditionGain,
                            condition,
                            context,
                        ),
                    );
                }

                const conditionTargets = this._spellActivityProcessingSharedService.determineConditionTargets(
                    newConditionGain,
                    { ...context, source: activity },
                );

                this._spellActivityProcessingSharedService.distributeGainingConditions(
                    newConditionGain,
                    conditionTargets,
                    activity,
                );
            }
        });

        return { conditionsToRemove, shouldClosePopupsAfterActivation };
    }

    private _deactivateExclusiveActivities(
        activity: Activity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            item: Equipment | Rune;
        },
    ): void {
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
                                this._activitiesDataService.activityFromName(activityGain.name),
                                false,
                                {
                                    ...context,
                                    target: context.creature.type,
                                    gain: activityGain,
                                },
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
                            itemActivity,
                            false,
                            {
                                ...context,
                                target: context.creature.type,
                                gain: itemActivity,
                            },
                        );
                    });
            }
        }
    }

    private _deactivateActivity(
        activity: Activity | ItemActivity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            targets: Array<Creature | SpellTarget>;
        },
    ): void {
        if (activity.hints.length) {
            this._refreshService.prepareChangesByHints(context.creature, activity.hints);
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
                this._itemGrantingService.dropGrantedItem(gainItem, context.creature);
            });

            if (context.gain instanceof ActivityGain) {
                context.gain.gainItems = [];
            }
        }

        //In manual mode, targets, conditions, one time effects and spells are not processed.
        if (!this._characterService.isManualMode) {

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
                    this._characterService.sendConditionToPlayers(
                        conditionTargets.filter(target => target instanceof SpellTarget) as Array<SpellTarget>, conditionGain, false,
                    );
                });
            }

            //Disable toggled spells
            if (activity.castSpells) {
                context.gain.castSpells.forEach(cast => {
                    const librarySpell = this._spellsDataService.spellFromName(cast.name);

                    if (librarySpell) {
                        if (cast.overrideChoices.length) {
                            //If the SpellCast has overrideChoices, copy them to the SpellGain.
                            cast.spellGain.overrideChoices = JSON.parse(JSON.stringify(cast.overrideChoices));
                        }

                        if (cast.duration) {
                            cast.spellGain.duration = cast.duration;
                        }

                        this._spellProcessingService.processSpell(
                            librarySpell,
                            false,
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