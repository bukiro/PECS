import { computed, effect, EffectRef, Injectable, Injector } from '@angular/core';
import { SettingsService } from 'src/libs/shared/app-status/domain/services/settings.service';
import { cacheEffect } from 'src/libs/shared/common/util/utils/cache-utils';
import { CreatureConditionRemovalService } from 'src/libs/shared/conditions/domain/services/creature-condition-removal.service';
import { CreatureConditionsService } from 'src/libs/shared/conditions/domain/services/creature-conditions.service';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { filterConditions } from 'src/libs/shared/conditions/util/utils/condition-filter-utils';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';

@Injectable({
    providedIn: 'root',
})
export class HealthService {

    private readonly _cache = {
        clampCreatureDamage: new Map<string, EffectRef>(),
        watchCreatureDying: new Map<string, EffectRef>(),
    };

    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        injector: Injector,
    ) {
        this._watchCreaturesDying(injector);
        this._clampCreaturesDamage(injector);
    }

    public async takeDamage(
        creature: Creature,
        amount: number,
        options: { nonlethal?: boolean } = {},
    ): Promise<{ dyingAddedAmount: number; hasAddedUnconscious: boolean; hasRemovedUnconscious: boolean }> {
        const health = creature.health;

        const tempHP = health.mainTemporaryHP$$();
        const tempHPAmount = tempHP.amount();

        // First, absorb damage with temporary HP and add the rest to health.damage.
        // Reset temp HP if it has reached 0,
        // and remove other options if you are starting to use up your first amount of temp HP.
        if (tempHPAmount) {
            if (tempHPAmount > amount) {
                tempHP.amount.update(value => value - amount);

                health.temporaryHP.set([tempHP]);
            } else {
                health.resetTemporaryHP();

                const remainingAmount = amount - tempHPAmount;

                health.damage.update(value => value + remainingAmount);
            }
        } else {
            health.damage.update(value => value + amount);
        }

        // Don't process conditions in manual mode.
        if (SettingsService.settings$$().manualMode()) {
            return ({ dyingAddedAmount: 0, hasAddedUnconscious: false, hasRemovedUnconscious: false });
        }

        // Handle any condition changes resulting from taking damage.
        return this._processDamageTriggeredConditions(creature, options);
    }

    public heal(
        creature: Creature,
        amount: number,
        options: {
            noWakeUp: boolean;
            noWoundedIncrease: boolean;
        },
    ): { hasRemovedDying: boolean; hasRemovedUnconscious: boolean } {
        let hasRemovedDying = false;
        let hasRemovedUnconscious = false;

        const health = creature.health;

        if (!amount) {
            return { hasRemovedDying, hasRemovedUnconscious };
        }

        health.damage.update(value => Math.max(0, value - amount));

        //Don't process conditions in manual mode.
        if (SettingsService.settings$$().manualMode()) {
            return { hasRemovedDying, hasRemovedUnconscious };
        }

        hasRemovedDying = this._stopDying(creature, options);

        if (!options.noWakeUp) {
            hasRemovedUnconscious = this._wakeFromHealing({ creature });
        }

        return { hasRemovedDying, hasRemovedUnconscious };
    }

    /**
     * Handle any condition changes resulting from taking damage
     */
    private _processDamageTriggeredConditions(
        creature: Creature,
        { nonlethal }: { nonlethal?: boolean },
    ): { dyingAddedAmount: number; hasAddedUnconscious: boolean; hasRemovedUnconscious: boolean } {
        const currentHPAmount = creature.healthAdapter.currentHP$$().result;
        const currentWounded = creature.healthAdapter.wounded$$();
        const currentDying = creature.healthAdapter.dying$$();

        let dyingAddedAmount = 0;
        let hasAddedUnconscious = false;
        let hasRemovedUnconscious = false;

        if (currentHPAmount === 0) {
            if (nonlethal) {
                // If you have reached 0 HP with nonlethal damage and aren't yet unconscious, become unconscious.
                hasAddedUnconscious = this._fallUnconsciousFromDamage(creature);
            } else {
                // If you have reached 0 HP with lethal damage and aren't yet dying, get dying 1+wounded.
                dyingAddedAmount = this._startDyingFromDamage(creature, { currentWounded, currentDying });
            }
        }

        // Wake up if you are unconscious and take damage (without falling under 1 HP)
        if (currentHPAmount > 0) {
            hasRemovedUnconscious = this._wakeFromDamage(creature);
        }

        return { dyingAddedAmount, hasAddedUnconscious, hasRemovedUnconscious };
    }

    /**
     * If you aren't yet unconscious, become unconscious.
     *
     * @returns Whether Unconscious has been added
     */
    private _fallUnconsciousFromDamage(creature: Creature): boolean {
        const dyingUnconsciousConditions = new Array<ConditionGain>()
            .concat(
                filterConditions(creature.conditions(), { name: 'Unconscious', source: '0 Hit Points' }),
                filterConditions(creature.conditions(), { name: 'Unconscious', source: 'Dying' }),
            );

        if (!dyingUnconsciousConditions.length) {
            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    {
                        name: 'Unconscious',
                        source: '0 Hit Points',
                    },
                    RecastService.recastFns,
                ),
            );

            return true;
        }

        return false;
    }

    /**
     * If you aren't yet dying, get Dying 1+wounded.
     *
     * @returns The received Dying value
     */
    private _startDyingFromDamage(
        creature: Creature,
        { currentWounded, currentDying }: {
            currentWounded: number;
            currentDying: number;
        },
    ): number {
        // TODO: This previously also tested whether there were any unconscious conditions.
        // That doesn't seem to make sense to me at the moment, but if unusual behavior occurs, it might be restored.
        // Check if the logic makes sense in the runtime.
        if (!currentDying) {
            const dyingAddedAmount = currentWounded + 1;

            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    {
                        name: 'Dying',
                        value: dyingAddedAmount, source: '0 Hit Points',
                    },
                    RecastService.recastFns,
                ),
            );

            return dyingAddedAmount;
        }

        return 0;
    }

    /**
     * If you are unconscious, wake up.
     *
     * @returns Whether any Unconscious condition has been removed
     */
    private _wakeFromDamage(creature: Creature): boolean {
        const unconsciousConditions = filterConditions(creature.conditions(), { name: 'Unconscious' });

        if (unconsciousConditions.length) {
            return this._creatureConditionRemovalService.removeConditions(unconsciousConditions, creature);
        }

        return false;
    }

    /**
     * Remove all Dying conditions and trigger an increase of the Wounded condition, unless prevented.
     *
     * @param increaseWounded Whether the Wounded condition should be increased by removing Dying
     * @returns Whether any Dying condition was removed
     */
    private _stopDying(creature: Creature, options: { noWoundedIncrease: boolean }): boolean {
        let hasRemovedDying = false;

        // Recover from Dying and get Wounded++
        const dyingConditions = filterConditions(creature.conditions(), { name: 'Dying' });

        if (dyingConditions.length) {
            // Removing the Dying condition automatically adds the Wounded condition, unless preventWoundedIncrease is set.
            hasRemovedDying = this._creatureConditionRemovalService.removeConditions(
                dyingConditions,
                creature,
                { preventWoundedIncrease: options.noWoundedIncrease },
            );
        }

        return hasRemovedDying;
    }

    /**
     * Remove all Unconscious conditions that are caused by Dying or HP being reduced to 0.
     *
     * @returns Whether any Unconscious condition was removed
     */
    private _wakeFromHealing({ creature }: { creature: Creature }): boolean {
        let hasRemovedUnconscious = false;

        const unconsciousConditions = [
            ...filterConditions(creature.conditions(), { name: 'Unconscious', source: '0 Hit Points' }),
            ...filterConditions(creature.conditions(), { name: 'Unconscious', source: 'Dying' }),
        ];

        hasRemovedUnconscious = this._creatureConditionRemovalService.removeConditions(
            unconsciousConditions,
            creature,
        );

        return hasRemovedUnconscious;
    }

    /**
     * If you aren't dead, die.
     */
    private _die(creature: Creature, reason: string): void {
        const deadConditions = filterConditions(creature.conditions(), { name: 'Dead' });

        if (!deadConditions.length) {
            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    {
                        name: 'Dead',
                        source: reason,
                    },
                    RecastService.recastFns,
                ),
            );

            // Remove doomed conditions when dead.
            const doomedConditions = filterConditions(creature.conditions(), { name: 'Doomed' });

            this._creatureConditionRemovalService.removeConditions(doomedConditions, creature);
        }
    }

    /**
     * Sets up and cleans up dying watchers for all creatures.
     */
    private _watchCreaturesDying(injector: Injector): void {
        const creatures$$ = CreatureService.character$$().minionsAdapter.allAvailableCreatures$$();
        const creatureIds$$ = computed(() => creatures$$().map(({ id }) => id));

        effect(
            () => {
                const creatures = creatures$$();

                creatures.forEach(creature => {
                    cacheEffect(
                        () => this._watchCreatureDying(creature, injector),
                        {
                            store: this._cache.watchCreatureDying,
                            key: creature.id,
                            untilFn: () => computed(() => !creatureIds$$().includes(creature.id)),
                            injector
                        },
                    );
                });
            },
            { injector },
        );
    }

    /**
     * Watches the Dying value of a creature and lets it die if the value gets too high.
     */
    private _watchCreatureDying(creature: Creature, injector: Injector): EffectRef {
        const doomedConditions$$ = creature.conditionsAdapter.appliedConditions$$({ name: 'Doomed' });
        const deadConditions$$ = creature.conditionsAdapter.appliedConditions$$({ name: 'Dead' });

        return effect(
            () => {
                if (SettingsService.settings$$().manualMode()) {
                    return;
                }

                const maxDying = creature.healthAdapter.maxDying$$();
                const dying = creature.healthAdapter.dying$$();
                const doomedConditions = doomedConditions$$();
                const deadConditions = deadConditions$$();

                if (deadConditions.length) {
                    return;
                }

                if (dying >= maxDying.result) {
                    if (doomedConditions.length) {
                        this._die(creature, 'Doomed');
                    } else {
                        this._die(creature, 'Dying value too high');
                    }
                }
            },
            { injector },
        );
    }

    /**
     * Sets up and cleans up damage watchers for all creatures.
     */
    private _clampCreaturesDamage(injector: Injector): void {
        const creatures$$ = CreatureService.character$$().minionsAdapter.allAvailableCreatures$$();
        const creatureIds$$ = computed(() => creatures$$().map(({ id }) => id));

        effect(
            () => {
                const creatures = creatures$$();

                creatures.forEach(creature => {
                    cacheEffect(
                        () => this._clampCreatureDamage(creature, injector),
                        {
                            store: this._cache.watchCreatureDying,
                            key: creature.id,
                            untilFn: () => computed(() => !creatureIds$$().includes(creature.id)),
                            injector
                        },
                    );
                });
            },
            { injector },
        );
    }


    /**
     * Watches the damage of each creature and reduces it if it exceeds max HP,
     * while keeping it above zero.
     */
    private _clampCreatureDamage(creature: Creature, injector: Injector): EffectRef {
        return effect(
            () => {
                const maxHP = creature.healthAdapter.maxHP$$();
                const damage = creature.health.damage();

                const clampedDamage = Math.max(Math.min(damage, maxHP.result), 0);

                if (damage !== clampedDamage) {
                    creature.health.damage.set(clampedDamage);
                }
            },
            { injector },
        );
    }
}

