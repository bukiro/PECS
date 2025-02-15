import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, tap, take } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureSizes } from '../../definitions/creature-sizes';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { CreaturePropertiesService } from '../creature-properties/creature-properties.service';
import { InventoryPropertiesService } from '../inventory-properties/inventory-properties.service';
import { BonusDescription } from '../../definitions/bonuses/bonus-description';
import { emptySafeZip } from '../../util/observable-utils';
import { applyEffectsToValue } from '../../util/effect.utils';

export interface BulkLiveValue {
    result: number;
    bonuses: Array<BonusDescription>;
}

enum SizeMultipliers {
    Tiny = .5,
    Medium = 1,
    Large = 2,
    Huge = 4,
    Gargantuan = 8,
}

@Injectable({
    providedIn: 'root',
})
export class BulkService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creaturePropertiesService: CreaturePropertiesService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
    ) { }

    public currentValue$(creature: Creature): Observable<BulkLiveValue> {
        return combineLatest([
            creature.inventories.values$,
            this._creatureEffectsService.absoluteEffectsOnThis$$(creature, 'Bulk'),
            this._creatureEffectsService.relativeEffectsOnThis$$(creature, 'Bulk'),
        ])
            .pipe(
                map(([inventories, absoluteEffects, relativeEffects]) => {
                    let result = 0;
                    let bonuses: Array<BonusDescription> = [];

                    // If absolute effects exist, the bulk is set to the effect value.
                    // Otherwise, it is calculated from the inventories' bulk.
                    if (absoluteEffects.length) {
                        ({ result, bonuses } = applyEffectsToValue(
                            result,
                            { absoluteEffects, bonuses, clearBonusesOnAbsolute: true },
                        ));
                    } else {
                        emptySafeZip(
                            inventories
                                .map(inventory =>
                                    this._inventoryPropertiesService.effectiveName$(inventory, creature)
                                        .pipe(
                                            tap(title => {
                                                // All bulk gets calculated at *10 to avoid rounding issues with decimals,
                                                // Then returned at /10
                                                const decimal = 10;

                                                // TO-DO: totalBulk needs to become reactive.
                                                const bulk = Math.floor(Math.max(0, inventory.totalBulk(false, true)) * decimal) / decimal;

                                                result += bulk;
                                                bonuses.push({
                                                    title,
                                                    value: `${ bulk }`,
                                                });
                                            }),
                                        ),
                                ),
                        )
                            .pipe(
                                take(1),
                            )
                            .subscribe();

                    }

                    ({ result, bonuses } = applyEffectsToValue(
                        result,
                        { relativeEffects, bonuses },
                    ));

                    return {
                        result: Math.floor(Math.max(0, result)),
                        bonuses,
                    };
                }),
            );
    }

    public encumberedLimit$(creature: Creature): Observable<BulkLiveValue> {
        const defaultEncumberedBaseLimit = 5;
        const effectTarget = 'Encumbered Limit';

        return this._bulkLimit$(creature, defaultEncumberedBaseLimit, effectTarget);
    }

    public maxLimit$(creature: Creature): Observable<BulkLiveValue> {
        const defaultBulkLimitBase = 10;
        const effectTarget = 'Max Bulk';

        return this._bulkLimit$(creature, defaultBulkLimitBase, effectTarget);
    }

    private _bulkLimit$(creature: Creature, baseLimit: number, effectTarget: string): Observable<BulkLiveValue> {
        return combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThis$$(creature, effectTarget),
            this._creatureEffectsService.relativeEffectsOnThis$$(creature, effectTarget),
            this._creaturePropertiesService.effectiveSize$(creature),
            this._abilityValuesService.mod$$('Strength', creature),
        ])
            .pipe(
                map(([absoluteEffects, relativeEffects, creatureSize, strengthModifier]) => {
                    // Start with the basic bulk.
                    let result = baseLimit;
                    let bonuses: Array<BonusDescription> = [{ title: 'Base Limit', value: `${ baseLimit }` }];

                    if (strengthModifier.result !== 0) {
                        result += strengthModifier.result;
                        bonuses.push({ title: 'Strength Modifier', value: `${ strengthModifier.result }` });
                    }

                    ({ result, bonuses } = applyEffectsToValue(
                        result,
                        { absoluteEffects, relativeEffects, bonuses, clearBonusesOnAbsolute: true },
                    ));

                    // Apply a multiplier for the creature's size.
                    let sizeMultiplier = 0;

                    switch (creatureSize) {
                        case CreatureSizes.Tiny:
                            sizeMultiplier = SizeMultipliers.Tiny;
                            break;
                        case CreatureSizes.Large:
                            sizeMultiplier = SizeMultipliers.Large;
                            break;
                        case CreatureSizes.Huge:
                            sizeMultiplier = SizeMultipliers.Huge;
                            break;
                        case CreatureSizes.Gargantuan:
                            sizeMultiplier = SizeMultipliers.Gargantuan;
                            break;
                        default:
                            sizeMultiplier = SizeMultipliers.Medium;
                    }

                    if (sizeMultiplier !== SizeMultipliers.Medium) {
                        result = Math.floor(result * sizeMultiplier);
                        bonuses.push({ title: 'Size Multiplier', value: `${ sizeMultiplier }` });
                    }

                    return { result, bonuses };
                }),
            );
    }

}
