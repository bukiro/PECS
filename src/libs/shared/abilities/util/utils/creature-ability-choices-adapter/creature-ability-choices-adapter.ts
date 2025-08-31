import { Signal } from '@angular/core';
import { AbilityChoice } from '../../models/ability-choice';
import { AbilityChoiceFilter } from '../../models/ability-choice-filter';

export abstract class CreatureAbilityChoicesAdapter {

    public abstract abilityChoices$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: AbilityChoiceFilter,
    ): Signal<Array<AbilityChoice>>;

}
