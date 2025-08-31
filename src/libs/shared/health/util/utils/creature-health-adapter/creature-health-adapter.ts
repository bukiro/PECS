import { computed, Signal } from '@angular/core';

import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { CreatureBaseHPAdapter } from '../creature-base-hp-adapter/creature-base-hp-adapter';
import { DefaultCreatureBaseHPAdapter } from '../creature-base-hp-adapter/default-creature-base-hp-adapter';
import { FamiliarBaseHPAdapter } from '../creature-base-hp-adapter/familiar-base-hp-adapter';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';

export class CreatureHealthAdapter {

    public readonly maxHP$$: Signal<ResultWithBonuses<number>>;

    public readonly currentHP$$: Signal<ResultWithBonuses<number>>;

    public readonly wounded$$: Signal<number>;

    public readonly dying$$: Signal<number>;

    public readonly maxDying$$: Signal<ResultWithBonuses<number>>;

    private readonly _baseHPAdapter: CreatureBaseHPAdapter;

    constructor(private readonly _creature: Character | Familiar | AnimalCompanion) {
        if (_creature.isFamiliar()) {
            this._baseHPAdapter = new FamiliarBaseHPAdapter(_creature);
        } else {
            this._baseHPAdapter = new DefaultCreatureBaseHPAdapter(_creature);
        }

        this.maxHP$$ = (() => {
            const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$('Max HP');
            const relativeEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$('Max HP');

            return computed(() => {
                const absoluteEffects = absoluteEffects$$();
                const relativeEffects = relativeEffects$$();
                let { result, bonuses } = this._baseHPAdapter.baseHP$$()

                    ; ({ result, bonuses } =
                        applyEffectsToValue(
                            result,
                            {
                                absoluteEffects,
                                relativeEffects,
                                bonuses,
                            },
                        ));

                return { result: Math.max(0, result), bonuses };
            });
        })();

        this.currentHP$$ = (() => computed(() => {
            const maxHP = this.maxHP$$();
            const tempHPAmount = this._creature.health.mainTemporaryHP$$().amount();
            const damage = this._creature.health.damage();

            const bonuses: Array<BonusDescription> = [{ title: 'Max HP', value: maxHP.result }];
            let sum = maxHP.result;

            if (tempHPAmount) {
                sum += tempHPAmount;
                bonuses.push({ title: 'Temporary HP', value: tempHPAmount });
            }

            if (damage) {
                sum -= damage;
                bonuses.push({ title: 'Damage taken', value: damage });
            }

            return { result: Math.max(sum, 0), bonuses };
        }))();

        this.wounded$$ = (() => {
            const conditions$$ = this._creature.conditionsAdapter.appliedConditions$$({ name: 'Wounded' });

            return computed(() => {
                const conditions = conditions$$();

                let woundeds = 0;

                if (conditions.length) {
                    // If multiple wounded conditions exist, the highest value counts.
                    woundeds = Math.max(...conditions.map(({ gain }) => gain.value()));
                }

                return Math.max(woundeds, 0);
            });
        })();

        this.dying$$ = (() => {
            const conditions$$ = this._creature.conditionsAdapter.appliedConditions$$({ name: 'Dying' });

            return computed(() => {
                const conditions = conditions$$();

                let dyings = 0;

                if (conditions.length) {
                    // If multiple dying conditions exist, the highest value counts.
                    dyings = Math.max(...conditions.map(({ gain }) => gain.value()));
                }

                return Math.max(dyings, 0);
            });
        })();

        this.maxDying$$ = (() => {
            const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$('Max Dying');
            const relativeEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$('Max Dying');

            return computed(() => {
                const absoluteEffects = absoluteEffects$$();
                const relativeEffects = relativeEffects$$();

                return applyEffectsToValue(Defaults.maxDyingValue, { absoluteEffects, relativeEffects });
            });
        })();
    }

}
