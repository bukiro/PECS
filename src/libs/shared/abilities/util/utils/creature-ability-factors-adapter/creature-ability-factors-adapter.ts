import { Signal } from '@angular/core';
import { AbilityBoost } from '../../models/ability-boost';
import { AbilityBoostType } from '../../models/ability-boost-type';

export const abilityBoostWeightFull = 2;
export const abilityBoostWeightHalf = 1;

export abstract class CreatureAbilityFactorsAdapter {

    /**
     * For Characters, positive Boosts count for +2 until 18, then they count for 1.
     * For other creatures, they always count for -2.
     * Negative Boosts (Flaws) always count for -2.
     * Info Boosts (e.g. ability boosts that denote your class ability without boosting it) do not count at all.
     *
     * @returns the value for which this boost counts
     */
    public abilityBoostWeight(boost: AbilityBoost, { currentValue }: { currentValue: number }): number {
        switch (boost.type) {
            case AbilityBoostType.Boost:
                return this._positiveAbilityBoostWeight({ currentValue });
            case AbilityBoostType.Flaw:
                return -abilityBoostWeightFull;
            default: return 0;
        }
    }

    public abstract abilityStartingValue$$(name: string): Signal<number>;

    protected abstract _positiveAbilityBoostWeight({ currentValue }: { currentValue: number }): number;

}
