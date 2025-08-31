/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { zip, of, map, take, combineLatest, Observable, tap } from 'rxjs';
import { ProcessingServiceProvider } from 'src/libs/app-shell/domain/services/processing-service-provider.service';
import { ActivitiesDataService } from 'src/libs/shared/activities/domain/services/activities-data.service';
import { Activity } from 'src/libs/shared/activities/util/models/activity';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { ItemActivity } from 'src/libs/shared/activities/util/models/item-activity';
import { SettingsService } from 'src/libs/shared/app-status/domain/services/settings.service';
import { emptySafeZip } from 'src/libs/shared/common/util/utils/observable-utils';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { ItemGrantingService } from 'src/libs/shared/items/domain/services/item-granting.service';
import { Equipment } from 'src/libs/shared/items/util/models/equipment';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { Rune } from 'src/libs/shared/items/util/models/rune';
import { PopoversService } from 'src/libs/shared/popovers/domain/services/popovers.service';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { SpellTarget } from 'src/libs/shared/spells/util/models/spell-target';
import { SpellTargetSelection } from 'src/libs/shared/spells/util/models/spell-target-selection';
import { ActivityPropertiesService } from './activity-properties.service';
import { ConditionsDataService } from 'src/libs/shared/conditions/domain/services/conditions-data.service';
import { CreatureConditionRemovalService } from 'src/libs/shared/conditions/domain/services/creature-condition-removal.service';
import { SpellsDataService } from 'src/libs/shared/spells/domain/services/spells-data.service';
import { CreatureEffectsService } from 'src/libs/shared/effects/domain/services/creature-effects.service';
import { SpellTargetService } from 'src/libs/shared/spells/domain/services/spell-target.service';

@Injectable({
    providedIn: 'root',
})
export class ActivitiesProcessingService {

    constructor(
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _popoversService: PopoversService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _spellTargetService: SpellTargetService,
        private readonly _messageSendingService: MessageSendingService,
        private readonly _onceEffectsService: OnceEffectsService,
        private readonly _psp: ProcessingServiceProvider,
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
        const item: Equipment | Rune | undefined = this._activitiesDataService.itemFromActivityGain(context.creature, context.gain);

        const targets: Array<Creature | SpellTarget> =
            this._spellTargetService.determineTargetsFromSpellTarget(context.target || '', context);

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
            item?: Equipment | Rune;
        },
    ): void {
        let shouldClosePopupsAfterActivation = false;

        this._activityPropertiesService.effectiveMaxCharges$$(activity, context);

        // Use charges
        this._useActivityCharges(activity, context);

        //The conditions listed in conditionsToRemove will be removed after the activity is processed.
        const conditionsToRemove: Array<string> = [];

        const effectiveActivityCooldown = context.gain.activeCooldown()
            ? 0
            : this._activityPropertiesService.effectiveCooldown$(activity, context);

        const conditionsToRemoveFromToggledActivation = activity.toggle
            //Determine the toggled activity's duration and save the names of the conditions that influenced it.
            ? this._activateToggledActivity$(activity, context)
            : [];

        const isManualMode = SettingsService.settings$$().manualMode();

        let gainingConditionsResult = {
            conditionsToRemove: new Array<string>(),
            shouldClosePopupsAfterActivation: false,
        };

        // Process gained conditions of the activity and keep the affecting conditions and whether to close popups.
        // Don't process gained conditions in manual mode.
        if (!isManualMode && activity.gainConditions) {
            const isSlottedAeonStone =
                (context.item && context.item.isWornItem() && context.item.isSlottedAeonStone);
            const conditions: Array<ConditionGain> =
                activity.gainConditions.filter(conditionGain => conditionGain.resonant ? isSlottedAeonStone : true);

            gainingConditionsResult = this._applyGainingConditions$(
                activity,
                conditions,
                {
                    ...context,
                    targets: context.targets,
                },
            );
        }


        // Start cooldown, unless one is already in effect.
        if (!context.gain.activeCooldown()) {
            if (effectiveActivityCooldown) {
                context.gain.activeCooldown.set(effectiveActivityCooldown);
            }
        }

        if (activity.toggle) {
            //Determine the toggled activity's duration and save the names of the conditions that influenced it.
            conditionsToRemove.push(...conditionsToRemoveFromToggledActivation);
        } else {
            context.gain.active.set(false);
            context.gain.duration.set(0);
            context.gain.selectedTarget = '';
        }

        //Process various results of activating the activity

        //Gain Items on Activation
        if (activity.gainItems.length) {
            if (context.gain instanceof ActivityGain) {
                context.gain.gainItems = activity.gainItems.map(gainItem => ItemGain.from(gainItem));
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
        if (!isManualMode) {

            //One time effects
            if (activity.onceEffects) {
                activity.onceEffects.forEach(effect => {
                    if (!effect.source) {
                        effect.source = activity.name;
                    }

                    this._onceEffectsService.processOnceEffect(context.creature, effect);
                });
            }

            //Apply conditions and save the names of the conditions that influenced their duration.
            if (activity.gainConditions) {
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
                            .map(spellCast => spellCast.clone());
                }

                context.gain.castSpells.forEach((cast, spellCastIndex) => {
                    const librarySpell = this._spellsDataService.spellFromName(cast.name);

                    if (librarySpell) {
                        if (context.gain.spellEffectChoices[spellCastIndex]?.length) {
                            cast.spellGain.effectChoices = context.gain.spellEffectChoices[spellCastIndex];
                        }

                        if (cast.overrideChoices.length) {
                            //If the SpellCast has overrideChoices, copy them to the SpellGain.
                            cast.spellGain.overrideChoices = JSON.parse(JSON.stringify(cast.overrideChoices));
                        }

                        if (cast.duration) {
                            cast.spellGain.duration = cast.duration;
                        }

                        cast.spellGain.selectedTarget = context.target || '';

                        this._psp.spellProcessingService?.processSpell(
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
        this._psp.spellActivityProcessingSharedService?.removeConditionsToRemove(conditionsToRemove, context);

        if (shouldClosePopupsAfterActivation) {
            this._popoversService.closePopovers();
        }

    }

    private _useActivityCharges(
        activity: Activity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            item?: Equipment | Rune;
        },
    ): void {
        // Use charges
        zip([
            this._activityPropertiesService.effectiveMaxCharges$$(activity, context),
            (context.gain.sharedChargesID)
                // If this activity belongs to an item and has a sharedCharges ID,
                // collect all of the item's activities with their effective cooldown and max charges.
                ? combineLatest([
                    ...context.item?.activities
                        .filter(itemActivity => itemActivity.sharedChargesID === context.gain.sharedChargesID) ?? [],
                    ...(context.item?.isEquipment() ? context.item.gainActivities : [])
                        .filter(gain => gain.sharedChargesID === context.gain.sharedChargesID),
                ]
                    .map(gain => combineLatest([
                        this._activityPropertiesService.effectiveMaxCharges$$(gain.originalActivity, context),
                        this._activityPropertiesService.effectiveCooldown$(gain.originalActivity, context),
                    ])
                        .pipe(
                            map(([maxCharges, cooldown]) => ({ gain, maxCharges, cooldown })),
                        ),
                    ),
                )
                : of([]),
        ])
            .pipe(
                take(1),
            )
            .subscribe(([maxCharges, children]) => {
                // If child activities with the same sharedChargesID were collected,
                // spend a charge for all of them and start their cooldown if necessary.
                children
                    .forEach(child => {
                        if (child.maxCharges) {
                            child.gain.chargesUsed += 1;
                        }

                        if (!child.gain.activeCooldown && child.cooldown) {
                            child.gain.activeCooldown = child.cooldown;
                        }
                    });

                if (maxCharges) {
                    context.gain.chargesUsed += 1;
                }
            });
    }

    /**
     * For a toggled activity, activate the activityGain and set its duration properly.
     * The duration can be influenced by condition effects.
     *
     * Returns the names of the conditions that should be removed after they changed the sustain duration.
     */
    private _activateToggledActivity$(
        activity: Activity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            target?: SpellTargetSelection;
        },
    ): Observable<Array<string>> {
        context.gain.active = true;

        if (activity.maxDuration) {
            context.gain.duration = activity.maxDuration;
        }

        context.gain.selectedTarget = context.target || '';

        return (
            activity.maxDuration
                ? zip([
                    this._creatureEffectsService
                        .absoluteEffectsOnThis$$(context.creature, `${ activity.name } Duration`),
                    this._creatureEffectsService
                        .relativeEffectsOnThis$$(context.creature, `${ activity.name } Duration`),
                ])
                : zip([
                    of([]),
                    of([]),
                ])
        )
            .pipe(
                take(1),
                // If an effect changes the duration of this activitiy, change the duration here.
                tap(([absoluteEffects, relativeEffects]) => {
                    context.gain.duration = applyEffectsToValue(
                        context.gain.duration,
                        { absoluteEffects, relativeEffects },
                    ).result;
                }),
                map(([absoluteEffects, relativeEffects]) =>
                    // Afterwards, the conditions causing the effects should be removed.
                    // Their names are returned for this process.
                    [...absoluteEffects, ...relativeEffects].map(({ source }) => source),
                ),
            );
    }

    private _applyGainingConditions$(
        activity: Activity,
        conditions: Array<ConditionGain>,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            item?: Equipment | Rune;
            targets: Array<Creature | SpellTarget>;
        },
    ): Observable<{ conditionsToRemove: Array<string>; shouldClosePopupsAfterActivation: boolean }> {
        let shouldClosePopupsAfterActivation = false;

        const hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter !== 'caster');
        const hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter === 'caster');
        const isCasterATarget: boolean = context.targets.some(target => target.id === context.creature.id);
        //Do the target and the caster get the same condition?
        const isCasterConditionSameAsTargetCondition: boolean =
            hasTargetCondition &&
            hasCasterCondition &&
            Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length === 1;

        return emptySafeZip(
            conditions.map((conditionGain, conditionIndex) => {
                const newConditionGain = conditionGain.clone(RecastService.recastFns);
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
                    this._psp.spellActivityProcessingSharedService?.shouldGainCondition(
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

                    return zip([
                        //Unless the conditionGain has a choice set, try to determine it by various factors.
                        newConditionGain.choice
                            ? of(newConditionGain.choice)
                            : this._psp.spellActivityProcessingSharedService.determineGainedConditionChoice$(
                                newConditionGain,
                                conditionIndex,
                                condition,
                                context,
                            ),
                        //Determine the condition's duration and the names of the conditions that influenced it.
                        this._psp.spellActivityProcessingSharedService.determineGainedConditionDuration$(
                            newConditionGain,
                            condition,
                            { ...context, source: activity },
                            { hasTargetCondition, isCasterATarget },
                        ),
                        //Determine the condition's value and the names of the conditions that influenced it.
                        condition.hasValue
                            ? this._psp.spellActivityProcessingSharedService.determineGainedConditionValue$(
                                newConditionGain,
                                condition,
                                context,
                            )
                            : of({ conditionsToRemove: [], newValue: newConditionGain.value }),
                    ])
                        .pipe(
                            map(([determinedConditionChoice, determinedConditionDuration, determinedConditionValue]) => {
                                //Determine the condition's duration and the names of the conditions that influenced it.
                                newConditionGain.choice = determinedConditionChoice;
                                newConditionGain.duration = determinedConditionDuration.newDuration;
                                newConditionGain.value = determinedConditionValue.newValue;

                                if (this._psp.spellActivityProcessingSharedService) {
                                    const conditionTargets = this._psp.spellActivityProcessingSharedService.determineConditionTargets(
                                        newConditionGain,
                                        { ...context, source: activity },
                                    );

                                    this._psp.spellActivityProcessingSharedService.distributeGainingConditions(
                                        newConditionGain,
                                        conditionTargets,
                                        activity,
                                    );
                                }

                                return determinedConditionDuration.conditionsToRemove
                                    .concat(
                                        determinedConditionValue.conditionsToRemove,
                                    );
                            }),
                        );
                }

                return of([]);
            }),
        )
            .pipe(
                map(conditionsToRemoveLists => ({
                    conditionsToRemove: new Array<string>().concat(...conditionsToRemoveLists),
                    shouldClosePopupsAfterActivation,
                })),
            );
    }

    private _deactivateExclusiveActivities(
        activity: Activity,
        context: {
            creature: Creature;
            gain: ActivityGain | ItemActivity;
            item?: Equipment | Rune;
        },
    ): void {
        // Exclusive activity activation:
        // If you activate one activity of an Item that has an exclusiveActivityID,
        // deactivate the other active activities on it that have the same ID.
        if (context.item && activity.toggle && context.gain.exclusiveActivityID) {
            if (context.item.activities.length + (context.item instanceof Equipment ? context.item.gainActivities : []).length > 1) {
                context.item instanceof Equipment &&
                    context.item.gainActivities
                        .filter((activityGain: ActivityGain) =>
                            activityGain !== context.gain &&
                            activityGain.active &&
                            activityGain.exclusiveActivityID === context.gain.exclusiveActivityID,
                        )
                        .forEach((activityGain: ActivityGain) => {
                            this.activateActivity(
                                activityGain.originalActivity,
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
        if (activity.cooldownAfterEnd) {
            this._activityPropertiesService.effectiveCooldown$(activity, context)
                .pipe(
                    take(1),
                )
                .subscribe(effectiveCooldown => {
                    // If the activity ends and cooldownAfterEnd is set, start the cooldown anew.
                    if (effectiveCooldown) {
                        context.gain.activeCooldown = effectiveCooldown;
                    }
                });
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
        if (!SettingsService.settings.manualMode) {

            //Remove applied conditions.
            //The condition source is the activity name.
            if (activity.gainConditions) {
                activity.gainConditions.forEach(conditionGain => {
                    const conditionTargets: Array<Creature | SpellTarget> =
                        (conditionGain.targetFilter === 'caster' ? [context.creature] : context.targets);

                    conditionTargets
                        .filter((target): target is Creature => target instanceof Creature)
                        .forEach(target => {
                            const matchingConditions =
                                target.conditions
                                    .filter(conditionFilter({ name: conditionGain.name }))
                                    .filter(creatureCondition =>
                                        creatureCondition.source === conditionGain.source &&
                                        creatureCondition.sourceGainID === (context.gain?.id || ''),
                                    );

                            this._creatureConditionRemovalService.removeConditionGains(matchingConditions, target);
                        });
                    this._messageSendingService.sendConditionToPlayers(
                        conditionTargets.filter((target): target is SpellTarget => target instanceof SpellTarget), conditionGain, false,
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

                        this._psp.spellProcessingService?.processSpell(
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
