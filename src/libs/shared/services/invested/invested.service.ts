import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { BonusDescription } from '../../ui/bonus-list';
import { Observable, combineLatest, map } from 'rxjs';
import { addBonusDescriptionFromEffect } from '../../util/bonusDescriptionUtils';
import { CreatureEquipmentService } from '../creature-equipment/creature-equipment.service';

export interface InvestedLiveValue {
    result: number;
    bonuses: Array<BonusDescription>;
    effects: Array<Effect>;
}

@Injectable({
    providedIn: 'root',
})
export class InvestedService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
    ) { }

    public maxLimit$(creature: Creature): Observable<InvestedLiveValue> {
        const effectTarget = 'Max Invested';

        return combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThis$(creature, effectTarget),
            this._creatureEffectsService.relativeEffectsOnThis$(creature, effectTarget),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    const characterBaseMax = 10;
                    const otherBaseMax = 2;

                    let result =
                        creature.isCharacter()
                            ? characterBaseMax
                            : otherBaseMax;

                    let bonuses: Array<BonusDescription> = [{ title: 'Base Limit', value: `${ result }` }];

                    absolutes
                        .forEach(effect => {
                            result = effect.setValueNumerical;
                            bonuses = addBonusDescriptionFromEffect([], effect);
                        });

                    relatives
                        .forEach(effect => {
                            result += effect.valueNumerical;
                            bonuses = addBonusDescriptionFromEffect([], effect);
                        });

                    const effects = new Array<Effect>(...absolutes, ...relatives);

                    return { result, bonuses, effects };
                }),
            );
    }

    public currentValue$(creature: Creature): Observable<number> {
        // Sum up the invested items:
        // If the item has aeon stones,
        //  1 for the item, and 1 for each Aeon Stone but the first.
        //  That is represented by 1 for each Aeon Stone, but at least 1.
        // Otherwise, just 1 for the item.
        return this._creatureEquipmentService.investedCreatureEquipment$(creature)
            .pipe(
                map(investedEquipment => investedEquipment
                    .reduce(
                        (amount, item) =>
                            amount + (
                                (item.isWornItem() && item.aeonStones.length)
                                    ? Math.max(item.aeonStones.length, 1)
                                    : 1
                            ),
                        0,
                    ),
                ),
            );

    }

}
