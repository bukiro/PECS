import { computed, Signal } from '@angular/core';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { Character } from 'src/libs/shared/character/util/models/character';
import { CreatureBaseHPAdapter } from './creature-base-hp-adapter';
import { signNumber } from 'src/libs/shared/common/util/utils/number-utils';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';

export class DefaultCreatureBaseHPAdapter implements CreatureBaseHPAdapter {

    public readonly baseHP$$: Signal<ResultWithBonuses<number>> = computed(() => {
        const charLevel = this._creature.level();
        const conMod = this._conMod$$().result;
        const creatureClass = this._creature.class();
        const ancestry = creatureClass.ancestry();

        const bonuses = new Array<BonusDescription>();
        let result = 0;

        if (creatureClass.hitPoints) {
            // Characters and Animal companions share the same function with only a small naming difference.
            const classHPSignifier = this._creature.isCharacter()
                ? 'Class'
                : 'Animal Companion';

            if (ancestry.name) {
                result += ancestry.hitPoints;
                bonuses.push({ title: 'Ancestry HP', value: ancestry.hitPoints });
            }

            result += (creatureClass.hitPoints + conMod) * charLevel;
            bonuses.push(
                {
                    title: `${ classHPSignifier } HP`,
                    subline: `(Base ${ classHPSignifier } HP)`,
                    value: creatureClass.hitPoints * charLevel,
                    valueSubline: creatureClass.hitPoints,
                },
                {
                    title: 'Constitution HP',
                    subline: '(Constitution Modifier)',
                    value: conMod * charLevel,
                    valueSubline: conMod,
                },
            );
        }

        return { result, bonuses };
    });

    private readonly _conMod$$: Signal<ResultWithBonuses<number>>;

    constructor(private readonly _creature: Character | AnimalCompanion) {
        this._conMod$$ = _creature.abilitiesAdapter.mod$$('Constitution');
    }

}
