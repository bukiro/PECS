import { Item } from 'src/app/classes/Item';
import { Hint } from 'src/app/classes/Hint';
import { Creature } from 'src/app/classes/Creature';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Effect } from 'src/app/classes/Effect';
import { ActivityGain } from './ActivityGain';
import { DiceSizes } from 'src/libs/shared/definitions/diceSizes';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class Trait {
    public desc = '';
    /**
     * effectDesc describes how to use the trait's effects, if needed.
     * Typically something like "Activate the first level for X and the second for Y".
     */
    public effectDesc = '';
    public dynamic = false;
    public dynamicDefault = DiceSizes.D6;
    /** Name any common activity that becomes available when you equip and invest an item with this trait. */
    public gainActivities: Array<ActivityGain> = [];
    public name = '';
    public hints: Array<Hint> = [];
    /**
     * Object effects apply only to the object that is bearing this trait,
     * and are evaluated within the object instead of the effects service.
     * Whether they are activated or not is saved in the object and accessed with 'active' in calculations.
     */
    public objectEffects: Array<EffectGain> = [];
    /**
     * If extraActivations is 1 through 4, up to four more activation boxes are shown to control the object effects.
     * Their state can be accessed with 'active2' through 'active5' in calculations.
     */
    public extraActivations = 0;
    public sourceBook = '';

    public recast(recastFns: RecastFns): Trait {
        this.gainActivities = this.gainActivities.map(obj => recastFns.activityGain(obj).recast(recastFns));
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.objectEffects = this.objectEffects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): Trait {
        return Object.assign<Trait, Trait>(new Trait(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    /**
     * Return all equipped items that have this trait, or alternatively only their names.
     * Some trait instances have information after the trait name,
     * so we allow traits that include this trait's name as long as this trait is dynamic.
     */
    public itemsWithThisTrait(creature: Creature, namesOnly = false): Array<Item> | Array<string> {
        const filteredItems: Array<Item> = [];

        creature.inventories.forEach(inventory => {
            filteredItems.push(...inventory.allEquipment()
                .filter(item =>
                    item.equipped &&
                    item.$traits
                        .find(trait =>
                            this.name.toLowerCase() === trait.toLowerCase() ||
                            (
                                trait.toLowerCase().includes(this.name.toLowerCase()) &&
                                this.dynamic
                            ),
                        ),
                ),
            );
        });

        if (namesOnly) {
            return filteredItems.map(item => item.displayName || item.name);
        } else {
            return filteredItems;
        }
    }

    public objectBoundEffects(
        activation: { trait: string; active: boolean; active2: boolean; active3: boolean },
        filter: Array<string> = [],
    ): Array<Effect> {
        /**
         * Collect all object effect gains of this hint that match the filter, and generate effects from them.
         * This uses a similar process to EvaluationService.get_ValueFromFormula, but with very reduced options.
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
                    let type = 'untyped';
                    let isPenaltyEffect = false;
                    let value = '0';
                    let setValue = '';

                    try {
                        //TO-DO: replace eval with system similar to featrequirements
                        // eslint-disable-next-line no-eval
                        value = eval(effect.value).toString();

                        if (parseInt(value, 10) > 0) {
                            value = `+${ value }`;
                        }
                    } catch (error) {
                        value = '0';
                    }

                    if (effect.setValue) {
                        try {
                            //TO-DO: replace eval with system similar to featrequirements
                            // eslint-disable-next-line no-eval
                            setValue = eval(effect.setValue).toString();
                        } catch (error) {
                            setValue = '';
                        }
                    }

                    if ((!parseInt(value, 10) && !parseFloat(value)) || parseFloat(value) === Infinity) {
                        value = '0';
                    }

                    if (effect.type) {
                        type = effect.type;
                    }

                    if (setValue) {
                        isPenaltyEffect = false;
                        value = '0';
                    } else {
                        isPenaltyEffect = (parseInt(value, 10) < 0) === (effect.affected !== 'Bulk');
                    }

                    //Effects can affect another creature. In that case, remove the notation and change the target.
                    const target = '';
                    const affected: string = effect.affected;

                    //Effects that have no value get ignored.
                    if (setValue || parseInt(value, 10) !== 0) {
                        resultingEffects.push(
                            Object.assign(
                                new Effect(value),
                                {
                                    creature: target,
                                    type,
                                    target: affected,
                                    setValue,
                                    toggle: false,
                                    source: `conditional, ${ this.name }`,
                                    penalty: isPenaltyEffect,
                                    show: shouldBeDisplayed,
                                }));
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
