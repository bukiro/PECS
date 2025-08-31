import { Signal } from '@angular/core';
import { Ability } from '../../models/ability';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { CreatureAbilityChoicesAdapter } from '../creature-ability-choices-adapter/creature-ability-choices-adapter';
import { CreatureAbilityBoostsAdapter } from '../creature-ability-boosts-adapter/creature-ability-boosts-adapter';
import { AbilityBoostFilter } from '../../models/ability-boost-filter';

export abstract class CreatureAbilitiesAdapter {

    public abstract abilityChoices$$: typeof CreatureAbilityChoicesAdapter.prototype.abilityChoices$$;

    public abstract abilityBoosts$$: typeof CreatureAbilityBoostsAdapter.prototype.abilityBoosts$$;

    /**
     * Determines the skill level at the given character level.
     *
     * @param excludeTemporary Skips changes from effects. This should be used for checking requirements.
     */
    public abstract value$$(
        abilityOrName: Ability | string,
        charLevel?: number,
        options?: { excludeTemporary?: boolean }
    ): Signal<ResultWithBonuses<number>>;

    public abstract mod$$(
        abilityOrName: Ability | string,
        charLevel?: number,
        options?: { excludeTemporary?: boolean }
    ): Signal<ResultWithBonuses<number>>;

    public abstract allBoostedAbilityNames$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter?: AbilityBoostFilter,
    ): Signal<Array<string>>;

}
