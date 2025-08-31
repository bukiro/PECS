import { computed, Signal } from '@angular/core';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { CreatureBaseHPAdapter } from './creature-base-hp-adapter';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';

export class FamiliarBaseHPAdapter implements CreatureBaseHPAdapter {

    public readonly baseHP$$: Signal<ResultWithBonuses<number>> = computed(() => {
        // A familiar has 5 Hit Points for each of the character's levels.
        const familiarHPMultiplier = 5;
        const charLevel = this._familiar.level();

        return ({
            result: familiarHPMultiplier * charLevel,
            bonuses: [
                {
                    title: 'Familiar HP',
                    subline: '(Base Familiar HP)',
                    value: familiarHPMultiplier * charLevel,
                    valueSubline: familiarHPMultiplier,
                },
            ],
        });
    });

    constructor(private readonly _familiar: Familiar) { }

}
