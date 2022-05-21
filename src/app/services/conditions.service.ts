/* eslint-disable max-lines */
/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Condition, ConditionOverride } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { ItemsService } from 'src/app/services/items.service';
import { EffectGain } from 'src/app/classes/EffectGain';
import * as json_conditions from 'src/assets/json/conditions';
import { Creature } from 'src/app/classes/Creature';
import { Activity } from 'src/app/classes/Activity';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Equipment } from 'src/app/classes/Equipment';
import { WornItem } from 'src/app/classes/WornItem';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { CreatureTypeIDFromType } from 'src/libs/shared/util/creatureUtils';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';

@Injectable({
    providedIn: 'root',
})
export class ConditionsService {

    private _conditions: Array<Condition> = [];
    private _initialized = false;
    private _currentCreatureConditions: Array<Array<ConditionGain>> = [[], [], []];
    private readonly _conditionsMap = new Map<string, Condition>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _evaluationService: EvaluationService,
        private readonly _refreshService: RefreshService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public replacementCondition(name?: string): Condition {
        return Object.assign(
            new Condition(),
            { name: 'Condition not found', desc: `${ name ? name : 'The requested condition' } does not exist in the conditions list.` },
        );
    }

    public conditionFromName(name: string): Condition {
        //Returns a named condition from the map.
        return this._conditionsMap.get(name.toLowerCase()) || this.replacementCondition(name);
    }

    public conditions(name = '', type = ''): Array<Condition> {
        if (!this.stillLoading) {
            //If only a name is given, try to find a condition by that name in the index map. This should be much quicker.
            if (name && !type) {
                return [this.conditionFromName(name)];
            } else {
                return this._conditions.filter(condition =>
                    (!name || condition.name.toLowerCase() === name.toLowerCase()) &&
                    (!type || condition.type.toLowerCase() === type.toLowerCase()),
                );
            }
        }

        return [new Condition()];
    }

    /**
     * Process all conditions of the creature and determine whether they should be applied, overridden, ignored etc.
     * set readonly to skip the processing if you are sure that they have just been processed.
     */
    public currentCreatureConditions(
        creature: Creature,
        characterService: CharacterService,
        activeConditions: Array<ConditionGain>,
        readonly = false,
    ): Array<ConditionGain> {
        const creatureIndex: number = CreatureTypeIDFromType(creature.type);

        const doesOverrideExistForCondition = (
            overrides: Array<{ override: ConditionOverride; source: string }>,
            gain: ConditionGain,
        ): boolean => overrides
            .some(override =>
                ['All', gain.name].includes(override.override.name) &&
                override.source !== gain.id,
            );
        const doesPauseExistForCondition = (
            pauses: Array<{ pause: ConditionOverride; source: string }>,
            gain: ConditionGain,
        ): boolean => pauses
            .some(pause =>
                ['All', gain.name].includes(pause.pause.name) &&
                pause.source !== gain.id,
            );

        // Readonly skips any modifications and just returns the currently applied conditions.
        // The same happens if the conditions haven't changed since the last run.
        if (!readonly && JSON.stringify(activeConditions) !== JSON.stringify(this._currentCreatureConditions[creatureIndex])) {
            let overrides: Array<{ override: ConditionOverride; source: string }> = [];
            let pauses: Array<{ pause: ConditionOverride; source: string }> = [];

            activeConditions.forEach(gain => {
                //Set apply for all conditions first, then change it later.
                gain.apply = true;

                const originalCondition = this.conditionFromName(gain.name);

                if (originalCondition.name === gain.name) {
                    //Mark any conditions for deletion if their duration is 0, or if they can have a value and their value is 0 or lower
                    //Add overrides for the rest if their conditionChoiceFilter matches the choice.
                    //Add pauses in the same way.
                    if ((originalCondition.hasValue && gain.value <= 0) || gain.duration === 0) {
                        gain.value = -1;
                    } else {
                        overrides.push(
                            ...originalCondition.conditionOverrides(gain)
                                .filter(override =>
                                    !override.conditionChoiceFilter?.length ||
                                    override.conditionChoiceFilter.includes(gain.choice),
                                )
                                .map(overrideCondition => ({ override: overrideCondition, source: gain.id })),
                        );
                        pauses.push(
                            ...originalCondition.conditionPauses(gain)
                                .filter(pause =>
                                    !pause.conditionChoiceFilter?.length ||
                                    pause.conditionChoiceFilter.includes(gain.choice),
                                )
                                .map(pauseCondition => ({ pause: pauseCondition, source: gain.id })),
                        );
                    }
                }
            });

            // Remove all conditions that were marked for deletion by setting their value to -1.
            // We use while so we don't mess up the index and skip some.
            // Ignore anything that would stop the condition from being removed (i.e. lockedByParent), or we will get stuck in this loop.
            while (activeConditions.some(gain => gain.value === -1)) {
                characterService.removeCondition(
                    creature,
                    activeConditions.find(gain => gain.value === -1),
                    false,
                    undefined,
                    undefined,
                    true,
                );
            }

            // Cleanup overrides, first iteration:
            // If any override comes from a condition that was removed
            // (e.g. as a child of a removed condition), the override is removed as well.
            overrides = overrides.filter(override => activeConditions.some(gain => gain.id === override.source));
            // Cleanup overrides, second iteration:
            // If any condition overrides "All" and is itself overridden, remove its overrides and pauses.
            // "All" overrides are more dangerous and need to be cleaned up before they override every other condition.
            activeConditions.forEach(gain => {
                if (overrides.some(override => override.source === gain.id && override.override.name === 'All')) {
                    if (doesOverrideExistForCondition(overrides, gain)) {
                        overrides = overrides.filter(override => override.source !== gain.id);
                        pauses = pauses.filter(pause => pause.source !== gain.id);
                    }
                }
            });
            // Cleanup overrides, third iteration:
            // If any overriding condition is itself overridden, its own overrides and pauses are removed.
            activeConditions.forEach(gain => {
                if (overrides.some(override => override.source === gain.id)) {
                    if (doesOverrideExistForCondition(overrides, gain)) {
                        overrides = overrides.filter(override => override.source !== gain.id);
                        pauses = pauses.filter(pause => pause.source !== gain.id);
                    }
                }
            });
            //Sort the conditions by how many levels of parent conditions they have (conditions without parents come first).
            //This allows us to first override the parents, then their dependent children.
            activeConditions
                .map(gain => {
                    let depth = 0;
                    let testGain = gain;

                    while (testGain?.parentID) {
                        depth++;
                        testGain = activeConditions.find(parent => parent.id === testGain.parentID);
                    }

                    return { depth, gain };
                })
                .sort((a, b) => a.depth - b.depth)
                .map(set => set.gain)
                .forEach(gain => {
                    const condition = this.conditionFromName(gain.name);

                    if (condition.name === gain.name) {
                        //Only process the conditions that haven't been marked for deletion.
                        if (gain.value !== -1) {
                            const parentGain = activeConditions.find(otherGain => otherGain.id === gain.parentID);

                            gain.paused = doesPauseExistForCondition(pauses, gain);

                            if (doesOverrideExistForCondition(overrides, gain)) {
                                //If any remaining condition override applies to this or all, disable this.
                                gain.apply = false;
                            } else if (parentGain && !parentGain.apply) {
                                //If the parent of this condition is disabled, disable this unless it is the source of the override.
                                gain.apply = false;
                            } else {
                                // If the condition has not been overridden, we compare it condition with all others
                                // that have the same name and deactivate it under certain circumstances.
                                // Are there any other conditions with this name and value that have not been deactivated yet?
                                activeConditions.filter(otherGain =>
                                    (otherGain !== gain) &&
                                    (otherGain.name === gain.name) &&
                                    (otherGain.apply),
                                ).forEach(otherGain => {
                                    // Unlimited conditions and higher value conditions remain,
                                    // same persistent damage value conditions are exclusive.
                                    if (condition.unlimited) {
                                        gain.apply = true;
                                    } else if (otherGain.value + otherGain.heightened > gain.value + gain.heightened) {
                                        gain.apply = false;
                                    } else if (otherGain.choice > gain.choice) {
                                        gain.apply = false;
                                    } else if (
                                        otherGain.value === gain.value &&
                                        otherGain.heightened === gain.heightened
                                    ) {
                                        // If the value and choice is the same:
                                        // Deactivate this condition if the other one has a longer duration
                                        // (and this one is not permanent), or is permanent (no matter if this one is).
                                        // The other condition will not be deactivated because it only gets compared
                                        // to the ones that aren't deactivated yet.
                                        if (otherGain.durationIsPermanent || (gain.duration >= 0 && otherGain.duration >= gain.duration)) {
                                            gain.apply = false;
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            //The currentCreatureConditions are cached here for readonly calls.
            this._currentCreatureConditions[creatureIndex] =
                activeConditions.map(gain => Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(gain))).recast());
        }

        return activeConditions
            .sort((a, b) => (a.name + a.id === b.name + b.id) ? 0 : ((a.name + a.id > b.name + b.id) ? 1 : -1));
    }

    public processCondition(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        itemsService: ItemsService,
        gain: ConditionGain,
        condition: Condition,
        taken: boolean,
        increaseWounded = true,
        ignoreEndsWithConditions = false,
    ): void {
        //Prepare components for refresh.
        if (condition.gainActivities.length) {
            this._refreshService.set_ToChange(creature.type, 'activities');
        }

        this._refreshService.set_HintsToChange(creature, condition.hints, { characterService });

        if (taken) {
            gain.maxDuration = gain.duration;
        }

        let didConditionDoAnything = false;
        let areOnceEffectsPrepared = false;

        //Copy the condition's ActivityGains to the ConditionGain so we can track its duration, cooldown etc.
        gain.gainActivities = condition.gainActivities
            .map(activityGain => Object.assign(new ActivityGain(), JSON.parse(JSON.stringify(activityGain))).recast());

        //One time effects
        if (taken) {
            condition.onceEffects.forEach(effect => {
                didConditionDoAnything = true;

                const tempEffect = Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(effect))).recast();

                //Copy some data to allow calculations and tracking temporary HP.
                if (!tempEffect.source) {
                    tempEffect.source = condition.name;
                    tempEffect.sourceId = gain.id;
                }

                if (!tempEffect.spellSource) {
                    tempEffect.spellSource = gain.spellSource;
                }

                characterService.prepareOnceEffect(
                    creature,
                    tempEffect,
                    gain.value,
                    gain.heightened,
                    gain.choice,
                    gain.spellCastingAbility,
                );
                areOnceEffectsPrepared = true;
            });
        }

        //One time effects when ending the condition
        if (!taken) {
            condition.endEffects.forEach(effect => {
                didConditionDoAnything = true;

                const tempEffect = Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(effect))).recast();

                //Copy some data to allow calculations and tracking temporary HP.
                if (!tempEffect.source) {
                    tempEffect.source = condition.name;
                    tempEffect.sourceId = gain.id;
                }

                if (!tempEffect.spellSource) {
                    tempEffect.spellSource = gain.spellSource;
                }

                characterService.prepareOnceEffect(
                    creature,
                    tempEffect,
                    gain.value,
                    gain.heightened,
                    gain.choice,
                    gain.spellCastingAbility,
                );
                areOnceEffectsPrepared = true;
            });
        }

        //Remove other conditions if applicable
        if (taken) {
            condition.endConditions.forEach(end => {
                didConditionDoAnything = true;
                characterService.currentCreatureConditions(creature, end.name)
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
                        characterService.removeCondition(creature, conditionGain, false, end.increaseWounded);
                    });
            });
        }

        //If this ends, remove conditions that have this listed in endsWithConditions
        if (!taken && !ignoreEndsWithConditions) {
            characterService.currentCreatureConditions(creature, '', '', true)
                .filter(conditionGain =>
                    this.conditionFromName(conditionGain.name).endsWithConditions
                        .some(endsWith => endsWith.name === condition.name && (!endsWith.source || gain.source === endsWith.source)),
                )
                .map(conditionGain =>
                    Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(conditionGain))).recast(),
                )
                .forEach(conditionGain => {
                    didConditionDoAnything = true;
                    characterService.removeCondition(creature, conditionGain, false);
                });
        }

        //Conditions that start when this ends. This happens if there is a nextCondition value.
        if (!taken) {
            condition.nextCondition.forEach(nextCondition => {
                if (!nextCondition.conditionChoiceFilter.length || nextCondition.conditionChoiceFilter.includes(gain.choice)) {
                    didConditionDoAnything = true;

                    const newGain: ConditionGain = new ConditionGain();

                    newGain.source = gain.source;
                    newGain.name = nextCondition.name;
                    newGain.duration = nextCondition.duration || -1;
                    newGain.choice = nextCondition.choice || this.conditionFromName(newGain.name)?.choice || '';
                    characterService.addCondition(creature, newGain, {}, { noReload: true });
                }
            });
        }

        //Gain other conditions if applicable
        //They are removed when this is removed in characterService.remove_Condition().
        //This is done after all steps where conditions are removed, so we don't accidentally remove these newly gained conditions.
        if (taken) {
            condition.gainConditions
                .filter(extraCondition =>
                    !extraCondition.conditionChoiceFilter.length ||
                    extraCondition.conditionChoiceFilter.includes(gain.choice),
                )
                .forEach(extraCondition => {
                    didConditionDoAnything = true;

                    const addCondition = Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(extraCondition))).recast();

                    if (!addCondition.heightened) {
                        addCondition.heightened = gain.heightened;
                    }

                    addCondition.source = gain.name;
                    addCondition.parentID = gain.id;
                    addCondition.apply = true;
                    characterService.addCondition(creature, addCondition, { parentConditionGain: gain }, { noReload: true });

                });
        }

        //Gain Items
        if (creature) {
            if (condition.gainItems.length) {
                this._refreshService.set_ToChange(creature.type, 'attacks');
                this._refreshService.set_ToChange(creature.type, 'inventory');

                if (taken) {
                    gain.gainItems = condition.heightenedItemGains(gain.heightened)
                        .map(itemGain => Object.assign<ItemGain, ItemGain>(new ItemGain(), JSON.parse(JSON.stringify(itemGain))).recast());
                    gain.gainItems
                        .filter(gainItem =>
                            !gainItem.conditionChoiceFilter.length ||
                            gainItem.conditionChoiceFilter.includes(gain.choice),
                        ).forEach(gainItem => {
                            didConditionDoAnything = true;
                            gainItem.grantGrantedItem(creature, { sourceName: condition.name }, { characterService, itemsService });
                        });
                } else {
                    gain.gainItems
                        .filter(gainItem =>
                            !gainItem.conditionChoiceFilter.length ||
                            gainItem.conditionChoiceFilter.includes(gain.choice),
                        ).forEach(gainItem => {
                            gainItem.dropGrantedItem(creature, {}, { characterService });
                        });
                    gain.gainItems = [];
                }
            }
        }

        //Stuff that happens when your Dying value is raised or lowered beyond a limit.
        if (gain.name === 'Dying') {
            didConditionDoAnything = true;

            if (taken) {
                if (creature.health.dying(creature, characterService) >= creature.health.maxDying(creature, effectsService)) {
                    if (!characterService.currentCreatureConditions(creature, 'Dead').length) {
                        characterService.addCondition(
                            creature,
                            Object.assign(new ConditionGain(), { name: 'Dead', source: 'Dying value too high' }).recast(),
                            {},
                            { noReload: true },
                        );
                    }
                }
            } else {
                if (creature.health.dying(creature, characterService) === 0) {
                    if (increaseWounded) {
                        if (creature.health.wounded(creature, characterService) > 0) {
                            characterService.currentCreatureConditions(creature, 'Wounded')
                                .forEach(existingGain => {
                                    existingGain.value++;
                                    existingGain.source = 'Recovered from Dying';
                                });
                        } else {
                            characterService.addCondition(
                                creature,
                                Object.assign(new ConditionGain(), { name: 'Wounded', value: 1, source: 'Recovered from Dying' }).recast(),
                                {},
                                { noReload: true },
                            );
                        }
                    }

                    if (!creature.health.currentHP(creature, characterService, effectsService).result) {
                        if (
                            !characterService.currentCreatureConditions(creature, 'Unconscious', '0 Hit Points').length &&
                            !characterService.currentCreatureConditions(creature, 'Unconscious', 'Dying').length
                        ) {
                            characterService.addCondition(
                                creature,
                                Object.assign(new ConditionGain(), { name: 'Unconscious', source: '0 Hit Points' }).recast(),
                                {},
                                { noReload: true },
                            );
                        }
                    }
                }
            }

            this._refreshService.set_ToChange(creature.type, 'health');
        }

        //End the condition's activity if there is one and it is active.
        if (!taken && gain.source) {
            const activityGains = characterService.creatureOwnedActivities(creature, creature.level, true)
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

                const activity = characterService.activitiesService.activities(activityGain.name)[0];

                if (activity) {
                    characterService.activitiesProcessingService
                        .activateActivity(
                            creature,
                            '',
                            characterService,
                            characterService.conditionsService,
                            characterService.itemsService,
                            characterService.spellsService,
                            activityGain,
                            activity,
                            false,
                            false,
                        );
                }
            }
        }

        //End the condition's spell or activity if there is one and it is active.
        if (!taken && gain.sourceGainID) {
            const character = characterService.character();

            //If no other conditions have this ConditionGain's sourceGainID, find the matching Spellgain or ActivityGain and disable it.
            if (
                !characterService.currentCreatureConditions(character)
                    .some(conditionGain => conditionGain !== gain && conditionGain.sourceGainID === gain.sourceGainID)
            ) {
                character.takenSpells(0, Defaults.maxCharacterLevel, { characterService })
                    .concat(character.allGrantedEquipmentSpells())
                    .filter(takenSpell => takenSpell.gain.id === gain.sourceGainID && takenSpell.gain.active)
                    .forEach(takenSpell => {
                        const spell = characterService.spellsService.get_Spells(takenSpell.gain.name)[0];

                        if (spell) {
                            characterService.spellsService.process_Spell(spell, false,
                                { characterService, itemsService, conditionsService: this },
                                { creature, target: takenSpell.gain.selectedTarget, gain: takenSpell.gain, level: 0 },
                            );
                        }

                        this._refreshService.set_ToChange('Character', 'spellbook');
                    });
                characterService.creatureOwnedActivities(creature, Defaults.maxCharacterLevel, true)
                    .filter(activityGain => activityGain.id === gain.sourceGainID && activityGain.active)
                    .forEach(activityGain => {
                        //Tick down the duration and the cooldown.
                        const activity: Activity | ItemActivity = activityGain.originalActivity(characterService.activitiesService);

                        if (activity) {
                            characterService.activitiesProcessingService.activateActivity(
                                creature,
                                activityGain.selectedTarget,
                                characterService,
                                characterService.conditionsService,
                                itemsService,
                                characterService.spellsService,
                                activityGain,
                                activity,
                                false,
                                false,
                            );
                        }

                        this._refreshService.set_ToChange('Character', 'activities');
                    });
            }
        }

        //Disable the condition's hints if deactivated.
        condition.hints.forEach(hint => {
            hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
        });

        //Leave cover behind shield if the Cover condition is removed.
        if (condition.name === 'Cover' && (!taken || (gain.choice !== 'Greater'))) {
            characterService.defenseService.equippedCreatureShield(creature).forEach(shield => {
                if (shield.takingCover) {
                    shield.takingCover = false;
                    this._refreshService.set_ToChange(creature.type, 'defense');
                }
            });
        }

        //If one-time-Effects are prepared, effects should be generated. Prepared one-time-effects get processed after effects generation.
        if (areOnceEffectsPrepared) {
            this._refreshService.set_ToChange(creature.type, 'effects');
        }

        //Changing senses should update senses.
        if (condition.senses.length) {
            this._refreshService.set_ToChange(creature.type, 'skills');
        }

        //Update Health when Wounded changes.
        if (condition.name === 'Wounded') {
            this._refreshService.set_ToChange(creature.type, 'health');
        }

        //Update Attacks when Hunt Prey or Flurry changes.
        if (['Hunt Prey', 'Hunt Prey: Flurry'].includes(condition.name)) {
            this._refreshService.set_ToChange(creature.type, 'attacks');
        }

        //Update Attacks if attack restrictions apply.
        if (condition.attackRestrictions.length) {
            this._refreshService.set_ToChange(creature.type, 'attacks');
        }

        //Update Defense if Defense conditions are changed.
        if (gain.source === 'Defense') {
            this._refreshService.set_ToChange(creature.type, 'defense');
        }

        //Update Time and Health if the condition needs attention.
        if (gain.durationIsInstant) {
            this._refreshService.set_ToChange(creature.type, 'time');
            this._refreshService.set_ToChange(creature.type, 'health');
        }

        //Show a notification if a new condition has no duration and did nothing, because it will be removed in the next cycle.
        if (taken && !didConditionDoAnything && gain.duration === 0) {
            characterService.toastService.show(
                `The condition <strong>${ gain.name }</strong> was removed because it had no duration and no effect.`,
            );
        }

    }

    public generateItemGrantedConditions(
        creature: Creature,
        services: { characterService: CharacterService; effectsService: EffectsService; itemsService: ItemsService },
    ): void {
        //Calculate whether any items should grant a condition under the given circumstances and add or remove conditions accordingly.
        //Conditions caused by equipment are not calculated in manual mode.
        if (services.characterService.isManualMode()) {
            return;
        }

        const character = services.characterService.character();

        let hasFoundSpeedRune = false;
        let shouldApplyAlignmentRunePenalty = false;

        creature.inventories.forEach(inventory => {
            inventory.allEquipment().forEach(item => {
                item.propertyRunes.forEach(rune => {
                    if (rune.name === 'Speed' && item.investedOrEquipped()) {
                        hasFoundSpeedRune = true;
                    }

                    if (rune instanceof WeaponRune && rune.alignmentPenalty && creature instanceof Character) {
                        if (character.alignment.toLowerCase().includes(rune.alignmentPenalty.toLowerCase())) {
                            shouldApplyAlignmentRunePenalty = true;
                        }
                    }
                });
                item.oilsApplied.forEach(oil => {
                    if (oil.runeEffect && oil.runeEffect.name === 'Speed' && item.investedOrEquipped()) {
                        hasFoundSpeedRune = true;
                    }

                    if (oil.runeEffect && oil.runeEffect.alignmentPenalty && creature instanceof Character) {
                        if (character.alignment.toLowerCase().includes(oil.runeEffect.alignmentPenalty.toLowerCase())) {
                            shouldApplyAlignmentRunePenalty = true;
                        }
                    }
                });
            });
        });

        const hasThisCondition = (name: string, source: string): boolean =>
            !!services.characterService.currentCreatureConditions(creature, name, source, true).length;
        const addCondition = (name: string, value: number, source: string): void => {
            services.characterService.addCondition(
                creature,
                Object.assign(new ConditionGain(), { name, value, source, apply: true }),
                {},
                { noReload: true },
            );
        };
        const removeCondition = (name: string, value: number, source: string): void => {
            services.characterService.removeCondition(
                creature,
                Object.assign(new ConditionGain(), { name, value, source, apply: true }),
                false,
            );
        };

        // Add Clumsy for each large weapon if you don't have it,
        // and remove Clumsy if you have it and don't have a large weapon equipped.
        if (
            creature.inventories[0].weapons
                .find(weapon => weapon.large && weapon.equipped) && !hasThisCondition('Clumsy', 'Large Weapon')
        ) {
            addCondition('Clumsy', 1, 'Large Weapon');
        } else if (
            !creature.inventories[0].weapons
                .find(weapon => weapon.large && weapon.equipped) && hasThisCondition('Clumsy', 'Large Weapon')
        ) {
            removeCondition('Clumsy', 1, 'Large Weapon');
        }

        // Add Quickened for a speed rune if you don't have it,
        // and remove Quickened if you have it and don't have a speed rune equipped.
        if (hasFoundSpeedRune && !hasThisCondition('Quickened', 'Speed Rune')) {
            addCondition('Quickened', 0, 'Speed Rune');
        } else if (!hasFoundSpeedRune && hasThisCondition('Quickened', 'Speed Rune')) {
            removeCondition('Quickened', 0, 'Speed Rune');
        }

        // Add Enfeebled for an alignment rune that you oppose if you don't have it,
        // and remove Enfeebled if you have it and don't have an alignment rune equipped that you oppose.
        const enfeebledPenaltyValue = 2;

        if (shouldApplyAlignmentRunePenalty && !hasThisCondition('Enfeebled', 'Alignment Rune')) {
            addCondition('Enfeebled', enfeebledPenaltyValue, 'Alignment Rune');
        } else if (!shouldApplyAlignmentRunePenalty && hasThisCondition('Enfeebled', 'Alignment Rune')) {
            removeCondition('Enfeebled', enfeebledPenaltyValue, 'Alignment Rune');
        }

        //Any items that grant permanent conditions need to check if these are still applicable.
        const refreshPermanentConditions = (item: Equipment, evaluationService: EvaluationService, investedItem: Equipment): void => {
            item.gainConditions.forEach(gain => {
                // We test alignmentFilter and resonant here, but activationPrerequisite is only tested
                // if the condition exists and might need to be removed.
                // This is because add_Condition includes its own test of activationPrerequisite.
                let shouldActivate = false;
                const isSlottedAeonStone = (item instanceof WornItem && item.isSlottedAeonStone);

                if (
                    investedItem.investedOrEquipped() &&
                    (
                        gain.resonant ?
                            isSlottedAeonStone :
                            true
                    ) && (
                        gain.alignmentFilter ?
                            (
                                gain.alignmentFilter.includes('!') !==
                                creature.alignment.toLowerCase().includes(gain.alignmentFilter.toLowerCase().replace('!', ''))
                            ) :
                            true
                    )
                ) {
                    shouldActivate = true;
                }

                if (
                    services.characterService.currentCreatureConditions(creature, gain.name, gain.source, true)
                        .filter(existingGain => !gain.choice || (existingGain.choice === gain.choice)).length
                ) {
                    if (!shouldActivate) {
                        services.characterService.removeCondition(creature, gain, false);
                    } else {
                        if (gain.activationPrerequisite) {
                            const testResult = evaluationService.get_ValueFromFormula(
                                gain.activationPrerequisite,
                                { characterService: services.characterService, effectsService: services.effectsService },
                                { creature, object: gain, parentItem: item },
                            );

                            if (testResult === '0' || !(parseInt(testResult as string, 10))) {
                                services.characterService.removeCondition(creature, gain, false);
                            }
                        }
                    }
                } else {
                    if (shouldActivate) {
                        services.characterService.addCondition(creature, gain, { parentItem: item }, { noReload: true });
                    }
                }
            });
        };

        creature.inventories[0].allEquipment()
            .filter(item => item.gainConditions.length)
            .forEach(item => {
                refreshPermanentConditions(item, this._evaluationService, item);
            });

        if (services.characterService.itemsService.get_TooManySlottedAeonStones(creature)) {
            creature.inventories[0].wornitems.filter(item => item.isWayfinder).forEach(item => {
                item.aeonStones.forEach(stone => {
                    refreshPermanentConditions(stone, this._evaluationService, item);
                });
            });
        }
    }

    /**
     * Remove all conditions that were gained from this item or slotted aeon stones.
     */
    public removeGainedItemConditions(creature: Creature, item: Equipment, characterService: CharacterService): void {
        const removeGainedConditions = (gain: ConditionGain): void => {
            if (
                characterService.currentCreatureConditions(creature, gain.name, gain.source, true)
                    .filter(existingGain => !gain.choice || (existingGain.choice === gain.choice))
                    .length
            ) {
                characterService.removeCondition(creature, gain, false);
            }
        };

        item.gainConditions.forEach(gain => {
            removeGainedConditions(gain);
        });

        if (item instanceof WornItem) {
            item.aeonStones.forEach(stone => {
                stone.gainConditions.forEach(gain => {
                    removeGainedConditions(gain);
                });
            });
        }
    }

    public generateBulkConditions(
        creature: Creature,
        services: { characterService: CharacterService; effectsService: EffectsService },
    ): void {
        //Calculate whether the creature is encumbered and add or remove the condition.
        //Encumbered conditions are not calculated in manual mode.
        if (!services.characterService.isManualMode()) {
            const bulk = creature.bulk;
            const calculatedBulk = bulk.calculate(creature, services.characterService, services.effectsService);

            if (
                calculatedBulk.current.value > calculatedBulk.encumbered.value &&
                !services.characterService.currentCreatureConditions(creature, 'Encumbered', 'Bulk').length
            ) {
                services.characterService.addCondition(
                    creature,
                    Object.assign(new ConditionGain(), { name: 'Encumbered', value: 0, source: 'Bulk', apply: true }),
                    {},
                    { noReload: true },
                );
            }

            if (
                calculatedBulk.current.value <= calculatedBulk.encumbered.value &&
                !!services.characterService.currentCreatureConditions(creature, 'Encumbered', 'Bulk').length
            ) {
                services.characterService.removeCondition(
                    creature,
                    Object.assign(new ConditionGain(), { name: 'Encumbered', value: 0, source: 'Bulk', apply: true }),
                    true,
                );
            }
        }
    }

    public tickConditions(
        creature: Creature,
        turns = 10,
        yourTurn: number,
        characterService: CharacterService,
        itemsService: ItemsService,
    ): void {
        const creatureConditions = creature.conditions;
        //If any conditions are currently stopping time, these are the only ones processed.
        const IsConditionStoppingTime = (gain: ConditionGain): boolean =>
            gain.duration && this.conditionFromName(gain.name).isStoppingTime(gain);
        const timeStoppingConditions = creatureConditions.filter(gain => IsConditionStoppingTime(gain));
        const includedConditions =
            timeStoppingConditions.length
                ? timeStoppingConditions.filter(gain => !gain.paused)
                : creatureConditions.filter(gain => !gain.paused);

        //If for any reason the maxDuration for a condition is lower than the duration, this is corrected here.
        includedConditions.filter(gain => gain.maxDuration > 0 && gain.maxDuration < gain.duration).forEach(gain => {
            gain.maxDuration = gain.duration;
        });

        const SortByShortestDuration = (conditions: Array<ConditionGain>): Array<ConditionGain> =>
            conditions.sort((a, b) => {
                // Sort conditions by the length of either their nextstage or their duration, whichever is shorter.
                const compareA: Array<number> = [];

                if (a.nextStage > 0) { compareA.push(a.nextStage); }

                if (a.duration > 0) { compareA.push(a.duration); }

                const compareB: Array<number> = [];

                if (b.nextStage > 0) { compareB.push(b.nextStage); }

                if (b.duration > 0) { compareB.push(b.duration); }

                if (!compareA.length) {
                    return 1;
                } else if (!compareB.length) {
                    return -1;
                } else {
                    return Math.min(...compareA) - Math.min(...compareB);
                }
            });

        let remainingTurns = turns;

        while (remainingTurns > 0) {
            if (
                includedConditions.some(gain =>
                    (
                        gain.duration > 0 &&
                        gain.choice !== 'Onset'
                    ) ||
                    gain.nextStage > 0,
                ) ||
                includedConditions.some(gain =>
                    gain.decreasingValue &&
                    !gain.valueLockedByParent &&
                    !(
                        gain.value === 1 &&
                        gain.lockedByParent
                    ),
                )
            ) {
                //Get the first condition that will run out.
                let first: number;

                // If any condition has a decreasing Value per round, that is not locked by a parent
                // step 5 (to the end of the Turn) if it is your Turn or 10 (1 turn) at most.
                // Otherwise find the next step from either the duration or the nextStage of the first gain of the sorted list.
                if (
                    includedConditions.some(gain =>
                        gain.value &&
                        gain.decreasingValue &&
                        !gain.valueLockedByParent &&
                        !(
                            gain.value === 1 &&
                            gain.lockedByParent
                        ),
                    )
                ) {
                    if (yourTurn === TimePeriods.HalfTurn) {
                        first = TimePeriods.HalfTurn;
                    } else {
                        first = TimePeriods.Turn;
                    }
                } else {
                    if (includedConditions.some(gain => (gain.duration > 0 && gain.choice !== 'Onset') || gain.nextStage > 0)) {
                        const firstObject: ConditionGain =
                            SortByShortestDuration(includedConditions).find(gain => gain.duration > 0 || gain.nextStage > 0);
                        const durations: Array<number> = [];

                        if (firstObject.duration > 0 && firstObject.choice !== 'Onset') { durations.push(firstObject.duration); }

                        if (firstObject.nextStage > 0) { durations.push(firstObject.nextStage); }

                        first = Math.min(...durations);
                    }
                }

                //Either step to the next condition to run out or decrease their value or step the given turns, whichever comes first.
                const step = Math.min(first, remainingTurns);

                includedConditions.filter(gain => gain.duration > 0 && gain.choice !== 'Onset').forEach(gain => {
                    gain.duration -= step;
                });
                //Conditions that have a nextStage value move that value forward, unless they don't have a duration.
                //If they don't have a duration, they will be removed in the conditions processing and should not change anymore.
                includedConditions.filter(gain => gain.nextStage > 0 && gain.duration !== 0).forEach(gain => {
                    gain.nextStage -= step;

                    if (gain.nextStage <= 0) {
                        // If a condition's nextStage expires, mark it as needing attention,
                        // or move to the next stage if automaticStages is on.
                        const condition = this.conditionFromName(gain.name);

                        if (condition.automaticStages) {
                            this.changeConditionStage(
                                creature,
                                gain,
                                condition,
                                condition.effectiveChoices(characterService, gain.source !== 'Manual', gain.heightened),
                                1,
                                characterService,
                                itemsService,
                            );
                        } else {
                            gain.nextStage = -1;
                        }
                    }
                });

                //If any conditions have their value decreasing, do this now.
                if (
                    (yourTurn === TimePeriods.HalfTurn && step === TimePeriods.HalfTurn) ||
                    (yourTurn === TimePeriods.NoTurn && step === TimePeriods.Turn)
                ) {
                    includedConditions
                        .filter(gain => gain.decreasingValue && !gain.valueLockedByParent && !(gain.value === 1 && gain.lockedByParent))
                        .forEach(gain => {
                            gain.value--;
                        });
                }

                remainingTurns -= step;
            } else {
                remainingTurns = 0;
            }
        }
    }

    public restConditions(creature: Creature, characterService: CharacterService): void {
        creature.conditions.filter(gain => gain.durationIsUntilRest).forEach(gain => {
            gain.duration = 0;
        });

        //After resting with full HP, the Wounded condition is removed.
        if (characterService.creatureHealth(creature).damage === 0) {
            creature.conditions
                .filter(gain => gain.name === 'Wounded')
                .forEach(gain => characterService.removeCondition(creature, gain, false));
        }

        // If Verdant Metamorphosis is active, remove the following non-permanent conditions after resting:
        // - Drained
        // - Enfeebled
        // - Clumsy
        // - Stupefied
        // - all poisons and diseases of 19th level or lower.
        const verdantMetamorphosisMaxAfflictionLevel = 19;

        if (characterService.effectsService.effectsOnThis(creature, 'Verdant Metamorphosis').length) {
            creature.conditions
                .filter(gain =>
                    gain.duration !== -1 &&
                    !gain.lockedByParent &&
                    ['Drained', 'Enfeebled', 'Clumsy', 'Stupefied'].includes(gain.name),
                )
                .forEach(gain => { gain.value = -1; });
            creature.conditions
                .filter(gain =>
                    gain.duration !== -1 &&
                    !gain.lockedByParent &&
                    gain.value !== -1 &&
                    this.conditions(gain.name)?.[0]?.type === 'afflictions',
                ).forEach(gain => {
                    if (
                        !characterService.itemsService.get_CleanItems().alchemicalpoisons
                            .some(poison => gain.name.includes(poison.name) && poison.level > verdantMetamorphosisMaxAfflictionLevel)
                    ) {
                        gain.value = -1;
                    }
                });
        }

        // After resting, the Fatigued condition is removed (unless locked by its parent),
        // and the value of Doomed and Drained is reduced (unless locked by its parent).
        creature.conditions
            .filter(gain => gain.name === 'Fatigued' && !gain.valueLockedByParent)
            .forEach(gain => characterService.removeCondition(creature, gain), false);
        creature.conditions
            .filter(gain => gain.name === 'Doomed' && !gain.valueLockedByParent && !(gain.lockedByParent && gain.value === 1))
            .forEach(gain => { gain.value -= 1; });
        creature.conditions
            .filter(gain => gain.name === 'Drained' && !gain.valueLockedByParent && !(gain.lockedByParent && gain.value === 1))
            .forEach(gain => {
                gain.value -= 1;

                if (gain.apply) {
                    creature.health.damage += creature.level;
                }

                if (
                    //If you have Fast Recovery or have activated the effect of Forge-Day's Rest, reduce the value by 2 instead of 1.
                    (
                        (creature instanceof Character) &&
                        characterService.characterFeatsTaken(1, creature.level, { featName: 'Fast Recovery' }).length
                    ) ||
                    characterService.featsService.get_Feats([], 'Forge-Day\'s Rest')?.[0]?.hints.some(hint => hint.active)
                ) {
                    gain.value -= 1;

                    if (gain.apply) {
                        creature.health.damage += creature.level;
                    }
                }
            });

        //If an effect with "X After Rest" is active, the condition is added.
        characterService.effectsService.effects(creature.type).all
            .filter(effect => !effect.ignored && effect.apply && effect.target.toLowerCase().includes(' after rest'))
            .forEach(effect => {
                const regex = new RegExp(' after rest', 'ig');
                const conditionName = effect.target.replace(regex, '');

                //Only add real conditions.
                if (this.conditions(conditionName).length) {
                    //Turn effect into condition:
                    //- no value or setValue (i.e. only toggle) means the condition is added without a value.
                    //- setValue means the condition has a value and is added with that value.
                    //- value means the value is added to an existing condition with the same name.
                    if (!creature.conditions.some(gain => gain.name === conditionName && gain.source === effect.source) || effect.value) {
                        const newCondition = new ConditionGain();

                        newCondition.name = conditionName;
                        newCondition.duration = -1;

                        if (effect.setValue) {
                            newCondition.value = parseInt(effect.setValue, 10);
                        }

                        if (parseInt(effect.value, 10)) {
                            newCondition.addValue = parseInt(effect.value, 10);
                        }

                        newCondition.source = effect.source;
                        characterService.addCondition(creature, newCondition, {}, { noReload: true });
                        characterService.toastService.show(
                            `Added <strong>${ conditionName }</strong> condition to <strong>${ creature.name || creature.type }`
                            + `</strong> after resting (caused by <strong>${ effect.source }</strong>)`,
                        );
                    }
                }
            });

    }

    public refocusConditions(creature: Creature): void {
        creature.conditions
            .filter(gain => gain.durationIsUntilRefocus)
            .forEach(gain => {
                gain.duration = 0;
            });
    }

    public changeConditionChoice(
        creature: Creature,
        gain: ConditionGain,
        condition: Condition,
        oldChoice: string,
        characterService: CharacterService,
        itemsService: ItemsService,
    ): void {
        let didConditionDoAnything = false;

        if (oldChoice !== gain.choice) {
            //Remove any items that were granted by the previous choice.
            if (oldChoice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter.includes(oldChoice)).forEach(gainItem => {
                    gainItem.dropGrantedItem((creature as AnimalCompanion | Character), {}, { characterService });
                });
            }

            //Add any items that are granted by the new choice.
            if (gain.choice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter.includes(gain.choice)).forEach(gainItem => {
                    didConditionDoAnything = true;
                    gainItem.grantGrantedItem(creature, { sourceName: condition.name }, { characterService, itemsService });
                });
            }
        }

        if (oldChoice !== gain.choice) {
            // Remove any conditions that were granted by the previous choice,
            // unless they are persistent (but still remove them if they are ignorePersistentAtChoiceChange).
            if (oldChoice) {
                condition.gainConditions
                    .filter(extraCondition => extraCondition.conditionChoiceFilter.includes(oldChoice))
                    .forEach(extraCondition => {
                        const conditionToAdd: ConditionGain =
                            Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(extraCondition))).recast();

                        conditionToAdd.source = gain.name;

                        const originalCondition = characterService.conditions(conditionToAdd.name)[0];

                        if (
                            !(
                                conditionToAdd.persistent ||
                                originalCondition?.persistent
                            ) ||
                            conditionToAdd.ignorePersistentAtChoiceChange
                        ) {
                            characterService.removeCondition(creature, conditionToAdd, false, false, true, true, true);
                        }
                    });
            }

            //Add any conditions that are granted by the new choice.
            if (gain.choice) {
                condition.gainConditions
                    .filter(extraCondition => extraCondition.conditionChoiceFilter.includes(gain.choice))
                    .forEach(extraCondition => {
                        didConditionDoAnything = true;

                        const conditionToAdd: ConditionGain =
                            Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(extraCondition))).recast();

                        if (!conditionToAdd.heightened) {
                            conditionToAdd.heightened = gain.heightened;
                        }

                        conditionToAdd.source = gain.name;
                        conditionToAdd.parentID = gain.id;
                        conditionToAdd.apply = true;
                        characterService.addCondition(creature, conditionToAdd, { parentConditionGain: gain }, { noReload: true });
                    });
            }

            //If the current duration is locking the time buttons, refresh the time bar after the change.
            if (gain.durationIsInstant || gain.nextStage) {
                this._refreshService.set_ToChange('Character', 'time');
            }

            // If the current duration is the default duration of the previous choice,
            // then set the default duration for the current choice.
            // This lets users change the choice directly after adding the condition if they made a mistake.
            if (gain.duration === condition.defaultDuration(oldChoice, gain.heightened).duration) {
                gain.duration = condition.defaultDuration(gain.choice, gain.heightened).duration;
                //Also set the maxDuration to the new value as we have effectively restarted the counter.
                gain.maxDuration = gain.duration;
            } else if (
                gain.duration === condition.defaultDuration(oldChoice, gain.heightened).duration + TimePeriods.UntilOtherCharactersTurn
            ) {
                // If the current duration is the default duration of the previous choice PLUS 2,
                // then set the default duration for the current choice, plus 2.
                // Only apply if the duration is over 0 and a multiple of half turns, not for special durations like -2 or 1.
                let addition = 0;

                if (gain.duration >= 0 && gain.duration % TimePeriods.HalfTurn === 0) {
                    addition = TimePeriods.UntilOtherCharactersTurn;
                }

                gain.duration = condition.defaultDuration(gain.choice, gain.heightened).duration + addition;
                //Also set the maxDuration to the new value as we have effectively restarted the counter.
                gain.maxDuration = gain.duration;
            }

            //If the new duration is locking the time buttons, refresh the time bar after the change.
            if (gain.durationIsInstant) {
                this._refreshService.set_ToChange('Character', 'time');
            }

            //Show a notification if the new condition has no duration and did nothing, because it will be removed in the next cycle.
            if (!didConditionDoAnything && gain.duration === 0) {
                characterService.toastService.show(
                    `The condition <strong>${ gain.name }</strong> was removed because it had no duration and no effect.`,
                );
            }

        }

        this._refreshService.set_ToChange(creature.type, 'effects');

        if (condition.attackRestrictions.length) {
            this._refreshService.set_ToChange(creature.type, 'attacks');
        }

        if (condition.senses.length) {
            this._refreshService.set_ToChange(creature.type, 'skills');
        }

        gain.showChoices = false;
        this._refreshService.set_HintsToChange(creature, condition.hints, { characterService });
    }

    public changeConditionStage(
        creature: Creature,
        gain: ConditionGain,
        condition: Condition,
        choices: Array<string>,
        change: number,
        characterService: CharacterService,
        itemsService: ItemsService,
    ): void {
        if (change === 0) {
            //If no change, the condition remains, but the onset is reset.
            gain.nextStage = condition.timeToNextStage(gain.choice);
            this._refreshService.set_ToChange(creature.type, 'time');
            this._refreshService.set_ToChange(creature.type, 'health');
            this._refreshService.set_ToChange(creature.type, 'effects');
        } else {
            let newIndex = choices.indexOf(gain.choice) + change;

            if (condition.circularStages) {
                while (newIndex < 0) {
                    newIndex += choices.length;
                }

                newIndex %= choices.length;
            }

            const newChoice = choices[newIndex];

            if (newChoice) {
                gain.nextStage = condition.timeToNextStage(newChoice);

                if (gain.nextStage) {
                    this._refreshService.set_ToChange(creature.type, 'time');
                    this._refreshService.set_ToChange(creature.type, 'health');
                }

                const oldChoice = gain.choice;

                gain.choice = newChoice;
                this.changeConditionChoice(creature, gain, condition, oldChoice, characterService, itemsService);
            }
        }
    }

    public initialize(): void {
        this._loadConditions();
        this._conditionsMap.clear();
        this._conditions.forEach(condition => {
            this._conditionsMap.set(condition.name.toLowerCase(), condition);
        });
        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._conditions.forEach(condition => {
            condition.hints.forEach(hint => {
                hint.active = false;
            });
        });
    }

    private _loadConditions(): void {
        this._conditions = [];

        const data = this._extensionsService.extend(json_conditions, 'conditions');

        Object.keys(data).forEach(key => {
            this._conditions.push(...data[key].map((obj: Condition) => Object.assign(new Condition(), obj).recast()));
        });
        this._conditions = this._extensionsService.cleanupDuplicates(this._conditions, 'name', 'conditions') as Array<Condition>;
    }

}
