import { computed, Signal } from '@angular/core';
import { CreatureSizes } from '../../models/creature-sizes';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { applySizeChange, legalSize } from '../creature-size-utils';

export abstract class CreatureSizeAdapter {

    public readonly size$$: Signal<ResultWithBonuses<number>>;

    public abstract readonly baseSize$$: Signal<ResultWithBonuses<CreatureSizes>>;

    constructor(
        private readonly _creature: Creature,
    ) {
        this.size$$ = (() => {
            const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$('Size');
            const relativeEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$('Size');

            return computed(() => {
                let { result, bonuses } = this.baseSize$$();
                const absoluteEffects = absoluteEffects$$();
                const relativeEffects = relativeEffects$$();

                // Apply effects while translating the numerical value into size names.
                absoluteEffects.forEach(effect => {
                    ({ result, bonuses } = applySizeChange({
                        change: legalSize(effect.setValueNumerical),
                        title: effect.source,
                        bonuses,
                    }));
                });

                relativeEffects.forEach(effect => {
                    ({ result, bonuses } = applySizeChange({
                        change: legalSize(result + effect.valueNumerical),
                        title: effect.source,
                        bonuses,
                    }));
                });

                return { result, bonuses };
            });
        })();
    }

}
