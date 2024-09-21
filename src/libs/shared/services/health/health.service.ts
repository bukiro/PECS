import { Injectable } from '@angular/core';
import { Observable, combineLatest, switchMap, map, of, distinctUntilChanged, tap, firstValueFrom } from 'rxjs';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { abilityModFromAbilityValue } from '../../util/ability-base-value-utils';
import { propMap$ } from '../../util/observable-utils';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { RecastService } from '../recast/recast.service';
import { SettingsService } from '../settings/settings.service';
import { CreatureConditionRemovalService } from '../creature-conditions/creature-condition-removal.service';
import { Defaults } from '../../definitions/defaults';
import { AppliedCreatureConditionsService } from '../creature-conditions/applied-creature-conditions.service';
import { filterConditions } from '../creature-conditions/condition-filter-utils';
import { cachedObservable } from '../../util/cache-utils';
import { TemporaryHP } from 'src/app/classes/creatures/temporary-hp';
import { applyEffectsToValue } from '../../util/effect.utils';
import { BonusDescription } from '../../definitions/bonuses/bonus-description';

@Injectable({
    providedIn: 'root',
})
export class HealthService {

    private readonly _cache = {
        maxHP: new Map<string, Observable<{ result: number; bonuses: Array<BonusDescription> }>>(),
        currentHP: new Map<string, Observable<{ result: number; bonuses: Array<BonusDescription> }>>(),
        wounded: new Map<string, Observable<number>>(),
        dying: new Map<string, Observable<number>>(),
        maxDying: new Map<string, Observable<{ result: number; bonuses: Array<BonusDescription> }>>(),
    };

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        this._watchCreatureDying();
        this._keepCreatureHealthAboveNegative();
    }

    public maxHP$(creature: Creature): Observable<{ result: number; bonuses: Array<BonusDescription> }> {
        return cachedObservable(
            combineLatest([
                CharacterFlatteningService.characterLevel$,
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Max HP'),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Max HP'),
            ])
                .pipe(
                    switchMap(([charLevel, absolutes, relatives]) =>
                        (
                            creature.requiresConForHP
                                ? this._abilityValuesService.baseValue$('Constitution', creature, charLevel)
                                    .pipe(
                                        map(conValue => conValue.result),
                                    )
                                : of(0)
                        )
                            .pipe(
                                map(conValue => ({ charLevel, absolutes, relatives, conValue })),
                            ),
                    ),
                    map(({ charLevel, absolutes, relatives, conValue }) => {
                        const conModifier = abilityModFromAbilityValue(conValue);
                        const baseHP = creature.baseHP(charLevel, conModifier);

                        const { result, bonuses } =
                            applyEffectsToValue(baseHP.result, { absoluteEffects: absolutes, relativeEffects: relatives });

                        return { result: Math.max(0, result), bonuses };
                    }),
                ),
            { store: this._cache.maxHP, key: creature.id },
        );
    }

    public currentHP$(creature: Creature): Observable<{ result: number; bonuses: Array<BonusDescription> }> {
        return cachedObservable(
            combineLatest([
                this.maxHP$(creature),
                propMap$(creature.health.mainTemporaryHP$, 'amount$'),
                creature.health.damage$,
            ])

                .pipe(
                    map(([maxHP, tempHPAmount, damage]) => {
                        const bonuses: Array<BonusDescription> = [{ title: 'Max HP', value: `${ maxHP.result }` }];

                        if (tempHPAmount) {
                            bonuses.push({ title: 'Temporary HP', value: `${ tempHPAmount }` });
                        }

                        if (damage) {
                            bonuses.push({ title: 'Damage taken', value: `${ damage }` });
                        }

                        const sum = maxHP.result + tempHPAmount - damage;

                        return { result: Math.max(sum, 0), bonuses };
                    }),
                ),
            { store: this._cache.currentHP, key: creature.id },
        );
    }

    public wounded$(creature: Creature): Observable<number> {
        return cachedObservable(
            this._appliedCreatureConditionsService.appliedCreatureConditions$(creature, { name: 'Wounded' })
                .pipe(
                    map(conditions => {
                        let woundeds = 0;

                        if (conditions.length) {
                            // If multiple wounded conditions exist, the highest value counts.
                            woundeds = Math.max(...conditions.map(({ gain }) => gain.value));
                        }

                        return Math.max(woundeds, 0);
                    }),
                ),
            { store: this._cache.wounded, key: creature.id },
        );
    }

    public dying$(creature: Creature): Observable<number> {
        return cachedObservable(
            this._appliedCreatureConditionsService.appliedCreatureConditions$(creature, { name: 'Dying' })
                .pipe(
                    map(conditions => {
                        let dyings = 0;

                        if (conditions.length) {
                            // If multiple dying conditions exist, the highest value counts.
                            dyings = Math.max(...conditions.map(({ gain }) => gain.value));
                        }

                        return Math.max(dyings, 0);
                    }),
                ),
            { store: this._cache.dying, key: creature.id },
        );
    }

    public maxDying$(creature: Creature): Observable<{ result: number; bonuses: Array<BonusDescription> }> {
        return cachedObservable(
            combineLatest([
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Max Dying'),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Max Dying'),
            ])
                .pipe(
                    map(([absoluteEffects, relativeEffects]) =>
                        applyEffectsToValue(Defaults.maxDyingValue, { absoluteEffects, relativeEffects }),
                    ),
                ),
            { store: this._cache.maxDying, key: creature.id },
        );
    }

    public async takeDamage$(
        creature: Creature,
        amount: number,
        { nonlethal }: { nonlethal?: boolean } = {},
    ): Promise<{ dyingAddedAmount: number; hasAddedUnconscious: boolean; hasRemovedUnconscious: boolean }> {
        const health = creature.health;

        const tempHP = health.mainTemporaryHP;

        // First, absorb damage with temporary HP and add the rest to this.damage.
        // Reset temp HP if it has reached 0,
        // and remove other options if you are starting to use up your first amount of temp HP.
        if (tempHP.amount) {
            const diff = Math.min(tempHP.amount, amount);

            tempHP.amount -= diff;
            health.temporaryHP.length = 1;

            if (tempHP.amount <= 0) {
                health.temporaryHP = [TemporaryHP.from({ amount: 0, source: '', sourceId: '' })];
            }

            const remainingAmount = amount - diff;

            health.damage += remainingAmount;
        } else {
            health.damage += amount;
        }

        // Don't process conditions in manual mode.
        if (SettingsService.settings.manualMode) {
            return ({ dyingAddedAmount: 0, hasAddedUnconscious: false, hasRemovedUnconscious: false });
        }

        // Handle any condition changes resulting from taking damage.
        return this._processDamageTriggeredConditions(creature, { nonlethal });
    }

    public heal(
        creature: Creature,
        amount: number,
        wake = true,
        increaseWounded = true,
    ): { hasRemovedDying: boolean; hasRemovedUnconscious: boolean } {
        let hasRemovedDying = false;
        let hasRemovedUnconscious = false;

        const health = creature.health;

        if (!amount) {
            return { hasRemovedDying, hasRemovedUnconscious };
        }

        health.damage = Math.max(0, health.damage - amount);

        //Don't process conditions in manual mode.
        if (SettingsService.settings.manualMode) {
            return { hasRemovedDying, hasRemovedUnconscious };
        }

        hasRemovedDying = this._stopDying({ creature, increaseWounded });

        if (wake) {
            hasRemovedUnconscious = this._wakeFromHealing({ creature });
        }

        return { hasRemovedDying, hasRemovedUnconscious };
    }

    /**
     * Handle any condition changes resulting from taking damage
     */
    private async _processDamageTriggeredConditions(
        creature: Creature,
        { nonlethal }: { nonlethal?: boolean },
    ): Promise<{ dyingAddedAmount: number; hasAddedUnconscious: boolean; hasRemovedUnconscious: boolean }> {
        const currentHPAmount = (await firstValueFrom(this.currentHP$(creature))).result;
        const currentWounded = await firstValueFrom(this.wounded$(creature));
        const currentDying = await firstValueFrom(this.dying$(creature));

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
        const dyingUnconsciousConditions =
            filterConditions(creature.conditions, { name: 'Unconscious', source: '0 Hit Points' })
                .concat(filterConditions(creature.conditions, { name: 'Unconscious', source: 'Dying' }));

        if (!dyingUnconsciousConditions.length) {
            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    { name: 'Unconscious', source: '0 Hit Points' },
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
                    { name: 'Dying', value: dyingAddedAmount, source: '0 Hit Points' },
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
     * @returns Whether Unconscious has been removed
     */
    private _wakeFromDamage(creature: Creature): boolean {
        const unconsciousConditions = filterConditions(creature.conditions, { name: 'Unconscious' });

        if (unconsciousConditions.length) {
            this._creatureConditionRemovalService.removeConditionGains(unconsciousConditions, creature);

            return true;
        }

        return false;
    }

    /**
     * Remove all Dying conditions and trigger an increase of the Wounded condition, unless prevented.
     *
     * @param increaseWounded Whether the Wounded condition should be increased by removing Dying
     * @returns Whether any Dying condition was removed
     */
    private _stopDying({ creature, increaseWounded }: { creature: Creature; increaseWounded: boolean }): boolean {
        let hasRemovedDying = false;

        // Recover from Dying and get Wounded++
        const dyingConditions = filterConditions(creature.conditions, { name: 'Dying' });

        if (dyingConditions.length) {
            // Removing the Dying condition automatically adds the Wounded condition, unless preventWoundedIncrease is set.
            hasRemovedDying = this._creatureConditionRemovalService.removeConditionGains(
                dyingConditions,
                creature,
                { preventWoundedIncrease: !increaseWounded },
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

        const unconsciousConditions = new Array<ConditionGain>()
            .concat(
                filterConditions(creature.conditions, { name: 'Unconscious', source: '0 Hit Points' }),
                filterConditions(creature.conditions, { name: 'Unconscious', source: 'Dying' }),
            );

        hasRemovedUnconscious = this._creatureConditionRemovalService.removeConditionGains(
            unconsciousConditions,
            creature,
        );

        return hasRemovedUnconscious;
    }

    /**
     * If you aren't dead, die.
     */
    private _die(creature: Creature, reason: string): void {
        const deadConditions = filterConditions(creature.conditions, { name: 'Dead' });

        if (!deadConditions.length) {
            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    { name: 'Dead', source: reason },
                    RecastService.recastFns,
                ),
            );

            // Remove doomed conditions when dead.
            const doomedConditions = filterConditions(creature.conditions, { name: 'Doomed' });

            this._creatureConditionRemovalService.removeConditionGains(doomedConditions, creature);
        }
    }

    /**
     * Watches the Dying value of every creature and lets them die if the value gets too high.
     */
    private _watchCreatureDying(): void {
        propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                // Don't do anything about your dying status in manual mode.
                switchMap(isManualMode =>
                    isManualMode
                        ? of(undefined)
                        : this._creatureAvailabilityService.forAllAvailableCreatures$(
                            creature =>
                                combineLatest([
                                    this.maxDying$(creature).pipe(distinctUntilChanged()),
                                    this.dying$(creature).pipe(distinctUntilChanged()),
                                    this._appliedCreatureConditionsService.appliedCreatureConditions$(creature, { name: 'Doomed' }),
                                ])
                                    .pipe(
                                        tap(([maxDying, dying, doomedConditions]) => {
                                            if (dying >= maxDying.result) {
                                                if (doomedConditions.length) {
                                                    this._die(creature, 'Doomed');
                                                } else {
                                                    this._die(creature, 'Dying value too high');
                                                }
                                            }
                                        }),
                                        map(() => undefined),
                                    ),
                        )),
            )
            .subscribe();
    }

    /**
     * Watches the damage of each creature and reduces it if it exceeds max HP.
     */
    private _keepCreatureHealthAboveNegative(): void {
        this._creatureAvailabilityService.forAllAvailableCreatures$(
            creature => combineLatest([
                this.maxHP$(creature),
                creature.health.damage$,
            ])
                .pipe(
                    tap(([maxHP, damage]) => {
                        if (damage > maxHP.result) {
                            creature.health.damage = maxHP.result;
                        }
                    }),
                ),
        )
            .subscribe();
    }
}

