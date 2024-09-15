/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, combineLatest, switchMap, map, of, take, distinctUntilChanged, tap, zip, filter } from 'rxjs';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { abilityModFromAbilityValue } from '../../util/ability-base-value-utils';
import { emptySafeCombineLatest, propMap$ } from '../../util/observable-utils';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { RecastService } from '../recast/recast.service';
import { RefreshService } from '../refresh/refresh.service';
import { SettingsService } from '../settings/settings.service';
import { CreatureConditionRemovalService } from '../creature-conditions/creature-condition-removal.service';
import { Defaults } from '../../definitions/defaults';
import { AppliedCreatureConditionsService } from '../creature-conditions/applied-creature-conditions.service';
import { filterConditions } from '../creature-conditions/condition-filter-utils';
import { cachedObservable } from '../../util/cache-utils';

@Injectable({
    providedIn: 'root',
})
export class HealthService {

    private readonly _cache = {
        maxHP: new Map<string, Observable<{ result: number; explain: string }>>(),
        currentHP: new Map<string, Observable<{ result: number; explain: string }>>(),
        wounded: new Map<string, Observable<number>>(),
        dying: new Map<string, Observable<number>>(),
        maxDying: new Map<string, Observable<number>>(),
    };

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _refreshService: RefreshService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        this._keepCreatureDyingUpdated();
    }

    public maxHP$(creature: Creature): Observable<{ result: number; explain: string }> {
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
                        let effectsSum = 0;

                        absolutes
                            .forEach(effect => {
                                effectsSum = effect.setValueNumerical;
                                baseHP.explain = `${ effect.source }: ${ effect.setValue }`;
                            });
                        relatives.forEach(effect => {
                            effectsSum += effect.valueNumerical;
                            baseHP.explain += `\n${ effect.source }: ${ effect.value }`;
                        });
                        baseHP.result = Math.max(0, baseHP.result + effectsSum);
                        baseHP.explain = baseHP.explain.trim();

                        return baseHP;
                    }),
                ),
            { store: this._cache.maxHP, key: creature.id },
        );
    }

    public currentHP$(creature: Creature): Observable<{ result: number; explain: string }> {
        const health = creature.health;

        return cachedObservable(
            this.maxHP$(creature)
                .pipe(
                    map(maxHP => {
                        const tempHP = health.mainTemporaryHP;

                        let sum = maxHP.result + tempHP.amount - health.damage;
                        let explain = `Max HP: ${ maxHP.result }`;

                        if (tempHP.amount) {
                            explain += `\nTemporary HP: ${ tempHP.amount }`;
                        }

                        //You can never get under 0 HP. If you do (because you just took damage), that gets corrected here,
                        // and the health component gets reloaded in case we need to process new conditions.
                        if (sum < 0) {
                            health.damage = Math.max(0, health.damage + sum);
                            sum = 0;
                            this._refreshService.prepareDetailToChange(creature.type, 'health');
                            this._refreshService.processPreparedChanges();
                        }

                        explain += `\nDamage taken: ${ health.damage }`;

                        return { result: sum, explain };
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
                        let woundeds = 0;

                        if (conditions.length) {
                            woundeds = Math.max(...conditions.map(({ gain }) => gain.value));
                        }

                        return Math.max(woundeds, 0);
                    }),
                ),
            { store: this._cache.dying, key: creature.id },
        );
    }

    public maxDying$(creature: Creature): Observable<number> {
        return cachedObservable(
            combineLatest([
                this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Max Dying'),
                this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Max Dying'),
            ])
                .pipe(
                    map(([absolutes, relatives]) => {
                        let effectsSum = Defaults.maxDyingValue;

                        absolutes
                            .forEach(effect => {
                                effectsSum = effect.valueNumerical;
                            });
                        relatives
                            .forEach(effect => {
                                effectsSum += effect.valueNumerical;
                            });

                        return effectsSum;
                    }),
                ),
            { store: this._cache.maxDying, key: creature.id },
        );
    }

    public takeDamage$(
        creature: Creature,
        amount: number,
        nonlethal = false,
        wounded?: number,
        dying?: number,
    ): Observable<{ dyingAddedAmount: number; hasAddedUnconscious: boolean; hasRemovedUnconscious: boolean }> {
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
                health.temporaryHP[0] = { amount: 0, source: '', sourceId: '' };
            }

            const remainingAmount = amount - diff;

            health.damage += remainingAmount;
        } else {
            health.damage += amount;
        }

        return zip(
            this.currentHP$(creature),
            wounded === undefined
                ? this.wounded$(creature)
                : of(wounded),
            dying === undefined
                ? this.dying$(creature)
                : of(dying),
        )
            .pipe(
                take(1),
                map(([currentHP, currentWounded, currentDying]) => {
                    const currentHPAmount = currentHP.result;
                    let dyingAddedAmount = 0;
                    let hasAddedUnconscious = false;
                    let hasRemovedUnconscious = false;

                    // Don't process conditions in manual mode.
                    if (!SettingsService.settings.manualMode) {
                        // Then, if you have reached 0 HP with lethal damage, get dying 1+wounded
                        // Dying and maxDying are compared in the Conditions service when Dying is added
                        if (!nonlethal && currentHPAmount === 0) {
                            if (currentDying === 0) {
                                if (
                                    !filterConditions(creature.conditions, { name: 'Unconscious', source: '0 Hit Points' })
                                        .length &&
                                    !filterConditions(creature.conditions, { name: 'Unconscious', source: 'Dying' })
                                        .length
                                ) {
                                    dyingAddedAmount = currentWounded + 1;
                                    this._creatureConditionsService.addCondition(
                                        creature,
                                        ConditionGain.from(
                                            { name: 'Dying', value: currentWounded + 1, source: '0 Hit Points' },
                                            RecastService.recastFns,
                                        ),
                                        {},
                                        { noReload: true },
                                    );
                                }
                            }
                        }

                        if (nonlethal && currentHPAmount === 0) {
                            if (
                                !filterConditions(creature.conditions, { name: 'Unconscious', source: '0 Hit Points' })
                                    .length &&
                                !filterConditions(creature.conditions, { name: 'Unconscious', source: 'Dying' })
                                    .length
                            ) {
                                hasAddedUnconscious = true;
                                this._creatureConditionsService.addCondition(
                                    creature,
                                    ConditionGain.from(
                                        { name: 'Unconscious', source: '0 Hit Points' },
                                        RecastService.recastFns,
                                    ),
                                    {},
                                    { noReload: true },
                                );
                            }
                        }

                        // Wake up if you are unconscious and take damage (without falling under 1 HP)
                        if (currentHPAmount > 0) {
                            filterConditions(creature.conditions, { name: 'Unconscious' })
                                .forEach(gain => {
                                    hasRemovedUnconscious = true;

                                    this._creatureConditionRemovalService.removeSingleCondition({ gain }, creature);
                                });
                        }
                    }

                    return { dyingAddedAmount, hasAddedUnconscious, hasRemovedUnconscious };
                }),
            );
    }

    public heal$(
        creature: Creature,
        amount: number,
        wake = true,
        increaseWounded = true,
        dying?: number,
    ): Observable<{ hasRemovedDying: boolean; hasRemovedUnconscious: boolean }> {
        const health = creature.health;

        health.damage = Math.max(0, health.damage - amount);

        let hasRemovedDying = false;
        let hasRemovedUnconscious = false;

        return zip([
            this.currentHP$(creature),
            dying === undefined
                ? this.dying$(creature)
                : of(dying),
        ])
            .pipe(
                take(1),
                map(([currentHP, currentDying]) => {
                    //Don't process conditions in manual mode.
                    if (SettingsService.settings.manualMode) {
                        return { hasRemovedDying, hasRemovedUnconscious };
                    }

                    //Recover from Dying and get Wounded++
                    if (currentHP.result > 0 && currentDying > 0) {
                        const dyingConditions = filterConditions(creature.conditions, { name: 'Dying' });

                        hasRemovedDying = this._creatureConditionRemovalService.removeConditionGains(
                            dyingConditions,
                            creature,
                            { preventWoundedIncrease: !increaseWounded },
                        );
                    }

                    //Wake up from Healing
                    if (wake) {
                        const unconsciousConditions = new Array<ConditionGain>()
                            .concat(
                                filterConditions(creature.conditions, { name: 'Unconscious', source: '0 Hit Points' }),
                                filterConditions(creature.conditions, { name: 'Unconscious', source: 'Dying' }),
                            );

                        hasRemovedUnconscious = this._creatureConditionRemovalService.removeConditionGains(
                            unconsciousConditions,
                            creature,
                        );
                    }

                    return { hasRemovedDying, hasRemovedUnconscious };
                }),
            );
    }

    private _die(creature: Creature, reason: string): void {
        const deadConditions = filterConditions(creature.conditions, { name: 'Dead' });

        if (!deadConditions.length) {
            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    { name: 'Dead', source: reason },
                    RecastService.recastFns,
                ),
                {},
                { noReload: true },
            );

            // Remove doomed conditions when dead.
            const doomedConditions = filterConditions(creature.conditions, { name: 'Doomed' });

            this._creatureConditionRemovalService.removeConditionGains(doomedConditions, creature);
        }
    }

    private _keepCreatureDyingUpdated(): void {
        // This pipe lets creatures die when their dying value is too high.
        combineLatest([
            propMap$(SettingsService.settings$, 'manualMode$'),
            this._creatureAvailabilityService.allAvailableCreatures$(),
        ])
            .pipe(
                // Don't do anything about your dying status in manual mode.
                filter(([manualMode]) => !manualMode),
                switchMap(([_, creatures]) =>
                    emptySafeCombineLatest(
                        creatures.map(creature =>
                            combineLatest([
                                this.maxDying$(creature).pipe(distinctUntilChanged()),
                                this.dying$(creature).pipe(distinctUntilChanged()),
                                this._appliedCreatureConditionsService.appliedCreatureConditions$(creature, { name: 'Doomed' }),
                            ])
                                .pipe(
                                    tap(([maxDying, dying, doomedConditions]) => {
                                        if (dying >= maxDying) {
                                            if (doomedConditions.length) {
                                                this._die(creature, 'Doomed');
                                            } else {
                                                this._die(creature, 'Dying value too high');
                                            }
                                        }
                                    }),
                                    map(() => undefined),
                                ),
                        ),
                    )),
            )
            .subscribe();
    }
}

