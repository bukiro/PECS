import { computed, Signal } from '@angular/core';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { abilityBoostWeightFull, abilityBoostWeightHalf, CreatureAbilityFactorsAdapter } from './creature-ability-factors-adapter';

export const abilityBoostWeightBreakpoint = 18;

export class CharacterAbilityFactorsAdapter extends CreatureAbilityFactorsAdapter implements CreatureAbilityFactorsAdapter {

    constructor(private readonly _character: Character) { super(); }

    public abilityStartingValue$$(name: string): Signal<number> {
        return computed(() =>
            this._character.baseValues()
                .find(ownValue => stringEqualsCaseInsensitive(ownValue.name, name))
                ?.baseValue
            ?? Defaults.abilityBaseValue,
        );
    }

    protected _positiveAbilityBoostWeight({ currentValue }: { currentValue: number }): number {
        return (currentValue >= abilityBoostWeightBreakpoint)
            ? abilityBoostWeightHalf
            : abilityBoostWeightFull;
    }

}
