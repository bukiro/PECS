import { signal, Signal } from '@angular/core';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { CreatureAbilitiesAdapter } from './creature-abilities-adapter';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { AbilityChoice } from '../../models/ability-choice';
import { AbilityBoost } from '../../models/ability-boost';

const baseAbilityValue$$: Signal<ResultWithBonuses<number>> = signal({ result: Defaults.abilityBaseValue, bonuses: [] }).asReadonly();
const zeroAbilityValue$$: Signal<ResultWithBonuses<number>> = signal({ result: 0, bonuses: [] }).asReadonly();
const emptyArray$$ = signal([]).asReadonly();

export class NullCreatureAbilitiesAdapter implements CreatureAbilitiesAdapter {

    public abilityChoices$$(): Signal<Array<AbilityChoice>> {
        return emptyArray$$;
    }

    public abilityBoosts$$(): Signal<Array<AbilityBoost>> {
        return emptyArray$$;
    }

    public value$$(): Signal<ResultWithBonuses<number>> {
        return baseAbilityValue$$;
    }

    public mod$$(): Signal<ResultWithBonuses<number>> {
        return zeroAbilityValue$$;
    }

    public allBoostedAbilityNames$$(): Signal<Array<string>> {
        return emptyArray$$;
    }

}
