import { Observable, switchMap, combineLatest, map } from 'rxjs';
import { BonusTypes } from 'src/libs/shared/definitions/bonus-types';
import { DiceSizes } from 'src/libs/shared/definitions/dice-sizes';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { ActivityGain } from '../activities/activity-gain';
import { Creature } from '../creatures/creature';
import { Effect } from '../effects/effect';
import { EffectGain } from '../effects/effect-gain';
import { Equipment } from '../items/equipment';
import { Item } from '../items/item';
import { Hint } from './hint';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Trait>({
    primitives: [
        'desc',
        'effectDesc',
        'dynamic',
        'dynamicDefault',
        'name',
        'extraActivations',
        'sourceBook',
    ],
    serializableArrays: {
        gainActivities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity(obj),
            }),
        hints:
            () => obj => Hint.from(obj),
        objectEffects:
            () => obj => EffectGain.from(obj),
    },
});

export class Trait implements Serializable<Trait> {
    public desc = '';
    /**
     * effectDesc describes how to use the trait's effects, if needed.
     * Typically something like "Activate the first level for X and the second for Y".
     */
    public effectDesc = '';
    public dynamic = false;
    public dynamicDefault = DiceSizes.D6;
    public name = '';
    /**
     * If extraActivations is 1 through 4, up to four more activation boxes are shown to control the object effects.
     * Their state can be accessed with 'active2' through 'active5' in calculations.
     */
    public extraActivations = 0;
    public sourceBook = '';

    /** Name any common activity that becomes available when you equip and invest an item with this trait. */
    public gainActivities: Array<ActivityGain> = [];
    public hints: Array<Hint> = [];
    /**
     * Object effects apply only to the object that is bearing this trait,
     * and are evaluated within the object instead of the effects service.
     * Whether they are activated or not is saved in the object and accessed with 'active' in calculations.
     */
    public objectEffects: Array<EffectGain> = [];

    public static from(values: DeepPartial<Trait>, recastFns: RecastFns): Trait {
        return new Trait().with(values, recastFns);
    }

    public with(values: DeepPartial<Trait>, recastFns: RecastFns): Trait {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Trait> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Trait {
        return Trait.from(this, recastFns);
    }

    public isEqual(compared: Partial<Trait>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    /**
     * Return all equipped items that have this trait.
     * Some trait instances have information after the trait name,
     * so we allow traits that include this trait's name as long as this trait is dynamic.
     */
    public itemsWithThisTrait$(creature: Creature): Observable<Array<Item>> {
        return creature.inventories.values$
            .pipe(
                switchMap(inventories => combineLatest(
                    inventories.map(inventory => inventory.equippedEquipment$
                        .pipe(
                            switchMap(items => combineLatest(
                                items.map(item => item.effectiveTraits$
                                    .pipe(
                                        map(traits =>
                                            traits.some(trait =>
                                                stringEqualsCaseInsensitive(this.name, trait, { allowPartialString: this.dynamic }),
                                            )
                                                ? item
                                                : null,
                                        ),
                                    ),
                                ),
                            )),
                            map(items => items.filter((item): item is Equipment => !!item)),
                        ),
                    ),
                )),
                map(equipmentLists =>
                    new Array<Item>()
                        .concat(...equipmentLists),
                ),
            );
    }

    /**
     * Return the names of all equipped items that have this trait.
     * Some trait instances have information after the trait name,
     * so we allow traits that include this trait's name as long as this trait is dynamic.
     */
    public itemNamesWithThisTrait$(creature: Creature): Observable<Array<string>> {
        return this.itemsWithThisTrait$(creature)
            .pipe(
                switchMap(items => combineLatest(
                    items.map(item => item.effectiveName$()),
                )),
            );
    }

    public objectBoundEffects(
        activation: { trait: string; active: boolean; active2: boolean; active3: boolean },
        filter: Array<string> = [],
    ): Array<Effect> {
        /**
         * Collect all object effect gains of this hint that match the filter, and generate effects from them.
         * This uses a similar process to EvaluationService.valueFromFormula$, but with very reduced options.
         * Only active, active2, active3 and dynamicValue are available as variables, and no toggle or title effects will be produced.
         * The resulting effects are very minimized, as only their value and setValue are required.
         */
        if (this.objectEffects) {
            const effects = this.objectEffects.filter(effect => !filter.length || filter.includes(effect.affected));

            if (effects.length) {
                const resultingEffects: Array<Effect> = [];
                /* eslint-disable @typescript-eslint/no-unused-vars */
                /* eslint-disable @typescript-eslint/naming-convention */
                const active = activation.active;
                const active2 = activation.active2;
                const active3 = activation.active3;
                const dynamicValue = this.dynamicValueAsNumber(activation.trait);
                /* eslint-enable @typescript-eslint/no-unused-vars */
                /* eslint-enable @typescript-eslint/naming-convention */

                effects.forEach(effect => {
                    const shouldBeDisplayed: boolean | undefined = effect.show;
                    let type = BonusTypes.Untyped;
                    let shouldInvertPenalty = false;
                    let value = '0';
                    let setValue = '';
                    let valueNumerical = 0;

                    try {
                        //TODO: replace eval with system similar to featrequirements
                        // eslint-disable-next-line no-eval
                        value = eval(effect.value).toString();

                        valueNumerical = parseInt(value, 10);

                        if (valueNumerical > 0) {
                            value = `+${ value }`;
                        }
                    } catch (error) {
                        value = '0';
                    }

                    if (effect.setValue) {
                        try {
                            //TODO: replace eval with system similar to featrequirements
                            // eslint-disable-next-line no-eval
                            setValue = eval(effect.setValue).toString();
                        } catch (error) {
                            setValue = '';
                        }
                    }

                    if ((!parseInt(value, 10) && !parseFloat(value)) || parseFloat(value) === Infinity) {
                        value = '0';
                        valueNumerical = 0;
                    }

                    if (effect.type) {
                        type = effect.type;
                    }

                    if (setValue) {
                        value = '0';
                    } else {
                        shouldInvertPenalty = (valueNumerical < 0) === (effect.affected !== 'Bulk');
                    }

                    //Effects can affect another creature. In that case, remove the notation and change the target.
                    const target = '';
                    const affected: string = effect.affected;

                    //Effects that have no value get ignored.
                    if (setValue || (valueNumerical !== 0)) {
                        resultingEffects.push(
                            Effect.from({
                                creature: target,
                                type,
                                target: affected,
                                setValue,
                                toggled: false,
                                source: `conditional, ${ this.name }`,
                                invertPenalty: shouldInvertPenalty,
                                displayed: shouldBeDisplayed,
                            }),
                        );
                    }
                });

                return resultingEffects;
            }
        }

        return [];
    }

    public dynamicValueAsNumber(traitName: string): number {
        // The dynamic value is usually a dice size.
        // Return the value of a dynamic trait, reduced to only the first number.
        if (this.dynamic && traitName.toLowerCase() !== this.name.toLowerCase()) {
            const value = traitName.replace(this.name, '').match(/(\d+)/)?.[0];

            if (value && !isNaN(parseInt(value, 10))) {
                return parseInt(value, 10);
            }
        } else if (this.dynamic && traitName === this.name) {
            //If the dynamic trait has no value, return the default.
            return this.dynamicDefault;
        }

        return 0;
    }
}
