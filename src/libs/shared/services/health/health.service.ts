/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, combineLatest, switchMap, map, of, take, distinctUntilChanged, tap } from 'rxjs';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { abilityModFromAbilityValue } from '../../util/ability-base-value-utils';
import { propMap$ } from '../../util/observableUtils';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { RecastService } from '../recast/recast.service';
import { RefreshService } from '../refresh/refresh.service';
import { SettingsService } from '../settings/settings.service';

export interface CalculatedHealth {
    maxHP$: Observable<{ result: number; explain: string }>;
    currentHP$: Observable<{ result: number; explain: string }>;
    wounded: number;
    dying: number;
    maxDying$: Observable<number>;
}

@Injectable({
    providedIn: 'root',
})
export class HealthService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _refreshService: RefreshService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        this._keepCreatureDyingUpdated();
    }

    public calculate(creature: Creature): CalculatedHealth {
        return {
            maxHP$: this.maxHP$(creature),
            currentHP$: this.currentHP$(creature),
            wounded: this.wounded(creature),
            dying: this.dying(creature),
            maxDying$: this.maxDying$(creature),
        };
    }

    public maxHP$(creature: Creature): Observable<{ result: number; explain: string }> {
        return combineLatest([
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
            );
    }

    public currentHP$(creature: Creature): Observable<{ result: number; explain: string }> {
        const health = creature.health;

        return this.maxHP$(creature)
            .pipe(
                map(maxHP => {
                    let sum = maxHP.result + health.temporaryHP[0].amount - health.damage;
                    let explain = `Max HP: ${ maxHP.result }`;

                    if (health.temporaryHP[0].amount) {
                        explain += `\nTemporary HP: ${ health.temporaryHP[0].amount }`;
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
            );
    }

    public wounded(creature: Creature): number {
        let woundeds = 0;
        const conditions = this._creatureConditionsService.currentCreatureConditions(creature, { name: 'Wounded' });

        if (conditions.length) {
            woundeds = Math.max(...conditions.map(gain => gain.value));
        }

        return Math.max(woundeds, 0);
    }

    public dying(creature: Creature): number {
        let dying = 0;
        const conditions = this._creatureConditionsService.currentCreatureConditions(creature, { name: 'Dying' });

        if (conditions.length) {
            dying = Math.max(...conditions.map(gain => gain.value));
        }

        return Math.max(dying, 0);
    }

    public maxDying$(creature: Creature): Observable<number> {
        return combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Max Dying'),
            this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Max Dying'),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    const defaultMaxDying = 4;
                    let effectsSum = 0;

                    absolutes
                        .forEach(effect => {
                            effectsSum = effect.valueNumerical;
                        });
                    relatives
                        .forEach(effect => {
                            effectsSum += effect.valueNumerical;
                        });

                    return defaultMaxDying + effectsSum;
                }),
            );
    }

    public takeDamage$(
        creature: Creature,
        amount: number,
        nonlethal = false,
        wounded: number = this.wounded(creature),
        dying: number = this.dying(creature),
    ): Observable<{ dyingAddedAmount: number; hasAddedUnconscious: boolean; hasRemovedUnconscious: boolean }> {
        const health = creature.health;

        // First, absorb damage with temporary HP and add the rest to this.damage.
        // Reset temp HP if it has reached 0,
        // and remove other options if you are starting to use up your first amount of temp HP.
        const diff = Math.min(health.temporaryHP[0].amount, amount);

        health.temporaryHP[0].amount -= diff;
        health.temporaryHP.length = 1;

        if (health.temporaryHP[0].amount <= 0) {
            health.temporaryHP[0] = { amount: 0, source: '', sourceId: '' };
        }

        const remainingAmount = amount - diff;

        health.damage += remainingAmount;

        return this.currentHP$(creature)
            .pipe(
                take(1),
                map(currentHP => {
                    const currentHPAmount = currentHP.result;
                    let dyingAddedAmount = 0;
                    let hasAddedUnconscious = false;
                    let hasRemovedUnconscious = false;

                    // Don't process conditions in manual mode.
                    if (!SettingsService.settings.manualMode) {
                        // Then, if you have reached 0 HP with lethal damage, get dying 1+wounded
                        // Dying and maxDying are compared in the Conditions service when Dying is added
                        if (!nonlethal && currentHPAmount === 0) {
                            if (dying === 0) {
                                if (
                                    !this._creatureConditionsService
                                        .currentCreatureConditions(creature, { name: 'Unconscious', source: '0 Hit Points' })
                                        .length &&
                                    !this._creatureConditionsService
                                        .currentCreatureConditions(creature, { name: 'Unconscious', source: 'Dying' })
                                        .length
                                ) {
                                    dyingAddedAmount = wounded + 1;
                                    this._creatureConditionsService.addCondition(
                                        creature,
                                        ConditionGain.from(
                                            { name: 'Dying', value: wounded + 1, source: '0 Hit Points' },
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
                                !this._creatureConditionsService
                                    .currentCreatureConditions(creature, { name: 'Unconscious', source: '0 Hit Points' })
                                    .length &&
                                !this._creatureConditionsService
                                    .currentCreatureConditions(creature, { name: 'Unconscious', source: 'Dying' })
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
                            this._creatureConditionsService
                                .currentCreatureConditions(creature, { name: 'Unconscious' })
                                .forEach(gain => {
                                    hasRemovedUnconscious = true;
                                    this._creatureConditionsService.removeCondition(creature, gain, false);
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
        dying: number = this.dying(creature),
    ): Observable<{ hasRemovedDying: boolean; hasRemovedUnconscious: boolean }> {
        const health = creature.health;

        health.damage = Math.max(0, health.damage - amount);

        let hasRemovedDying = false;
        let hasRemovedUnconscious = false;

        return this.currentHP$(creature)
            .pipe(
                take(1),
                map(currentHP => {
                    //Don't process conditions in manual mode.
                    if (!SettingsService.settings.manualMode) {
                        //Recover from Dying and get Wounded++
                        if (currentHP.result > 0 && dying > 0) {
                            this._creatureConditionsService
                                .currentCreatureConditions(creature, { name: 'Dying' })
                                .forEach(gain => {
                                    hasRemovedDying = true;
                                    this._creatureConditionsService.removeCondition(creature, gain, false, increaseWounded);
                                });
                        }

                        //Wake up from Healing
                        if (wake) {
                            this._creatureConditionsService
                                .currentCreatureConditions(creature, { name: 'Unconscious', source: '0 Hit Points' })
                                .forEach(gain => {
                                    hasRemovedUnconscious = true;
                                    this._creatureConditionsService.removeCondition(creature, gain);
                                });
                            this._creatureConditionsService
                                .currentCreatureConditions(creature, { name: 'Unconscious', source: 'Dying' })
                                .forEach(gain => {
                                    hasRemovedUnconscious = true;
                                    this._creatureConditionsService.removeCondition(creature, gain, false);
                                });
                        }
                    }

                    return { hasRemovedDying, hasRemovedUnconscious };
                }),
            );
    }

    public die(creature: Creature, reason: string): void {
        if (
            !this._creatureConditionsService
                .currentCreatureConditions(creature, { name: 'Dead' })
                .length
        ) {
            this._creatureConditionsService.addCondition(
                creature,
                ConditionGain.from(
                    { name: 'Dead', source: reason },
                    RecastService.recastFns,
                ),
                {},
                { noReload: true },
            );
            this._creatureConditionsService
                .currentCreatureConditions(creature, { name: 'Doomed' }, { readonly: true })
                .forEach(gain => {
                    this._creatureConditionsService.removeCondition(creature, gain, false);
                });
        }
    }

    private _keepCreatureDyingUpdated(): void {
        // This pipe lets creatures die when their dying value is too high.
        combineLatest([
            propMap$(SettingsService.settings$, 'manualMode$'),
            this._creatureAvailabilityService.allAvailableCreatures$(),
        ])
            .pipe(
                switchMap(([manualMode, creatures]) => combineLatest(
                    creatures.map(creature =>
                        // Don't do anything about your dying status in manual mode.
                        manualMode
                            ? of()
                            : combineLatest([
                                this.maxDying$(creature),
                                //TODO: dying needs to be async, or else this won't ever update.
                                of(this.dying(creature)),
                            ])
                                .pipe(
                                    distinctUntilChanged(),
                                    tap(([maxDying, dying]) => {

                                        if (dying >= maxDying) {
                                            if (
                                                this._creatureConditionsService
                                                    .currentCreatureConditions(creature, { name: 'Doomed' })
                                                    .length
                                            ) {
                                                this.die(creature, 'Doomed');
                                            } else {
                                                this.die(creature, 'Dying value too high');
                                            }
                                        }
                                    }),
                                ),
                    ),
                )),
            )
            .subscribe();
    }
}

