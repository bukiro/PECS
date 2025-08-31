import { signal, Signal } from '@angular/core';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { abilityBoostWeightFull, CreatureAbilityFactorsAdapter } from './creature-ability-factors-adapter';

export class DefaultCreatureAbilityFactorsAdapter extends CreatureAbilityFactorsAdapter implements CreatureAbilityFactorsAdapter {

    public abilityStartingValue$$(): Signal<number> {
        return signal(Defaults.abilityBaseValue).asReadonly();
    }

    protected _positiveAbilityBoostWeight(): number {
        return abilityBoostWeightFull;
    }

}
