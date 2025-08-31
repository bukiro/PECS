import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';
import { DiceSizes } from 'src/libs/shared/dice/util/models/dice-sizes';
import { bonusTypes } from 'src/libs/shared/effects/util/models/bonus-types';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';

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
            recastFns => obj => ActivityGain.from(obj, recastFns),
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

    public static from(values: MaybeSerialized<Trait>, recastFns: RecastFns): Trait {
        return new Trait().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Trait>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Trait> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Trait.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Trait>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
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
                /* eslint-disable @typescript-eslint/no-unused-vars */
                /* eslint-disable @typescript-eslint/naming-convention */
                const active = activation.active;
                const active2 = activation.active2;
                const active3 = activation.active3;
                const dynamicValue = this._dynamicValueAsNumber(activation.trait);
                /* eslint-enable @typescript-eslint/no-unused-vars */
                /* eslint-enable @typescript-eslint/naming-convention */

                const resultingEffects: Array<Effect> =
                    // eslint-disable-next-line complexity
                    effects.map(effect => {
                        const shouldBeDisplayed: boolean | undefined = effect.show;
                        const type = effect.type ?? bonusTypes.untyped;
                        let shouldInvertPenalty = false;
                        let value = 0;
                        let setValue: number | null = null;

                        try {
                            //TODO: replace eval with system similar to featrequirements
                            // eslint-disable-next-line no-eval
                            value = eval(effect.value());
                        } catch (error) {
                            value = 0;
                        }

                        if (effect.setValue) {
                            try {
                                //TODO: replace eval with system similar to featrequirements
                                // eslint-disable-next-line no-eval
                                setValue = eval(effect.setValue());
                            } catch (error) {
                                setValue = null;
                            }
                        }

                        if (setValue !== null) {
                            value = 0;
                        } else {
                            shouldInvertPenalty = (value < 0) === (effect.affected !== 'Bulk');
                        }

                        //Effects can affect another creature. In that case, remove the notation and change the target.
                        const target = '';
                        const affected: string = effect.affected;

                        //Effects that have no value get ignored.
                        if (setValue !== null || value !== 0) {
                            return Effect.from({
                                creature: target,
                                type,
                                target: affected,
                                setValueNumerical: setValue,
                                valueNumerical: value,
                                toggled: false,
                                source: `conditional, ${ this.name }`,
                                invertPenalty: shouldInvertPenalty,
                                displayed: shouldBeDisplayed,
                            });
                        }
                    })
                        .filter(isDefined);

                return resultingEffects;
            }
        }

        return [];
    }

    private _dynamicValueAsNumber(traitName: string): number {
        if (!this.dynamic) {
            return 0;
        }

        if (stringEqualsCaseInsensitive(traitName, this.name)) {
            //If the dynamic trait has no value, return the default.
            return this.dynamicDefault;
        } else {
            // The dynamic value is usually a dice size.
            // Return the value of a dynamic trait, reduced to only the first number.
            const value = traitName.replace(this.name, '').match(/(\d+)/)?.[0];

            if (value && !isNaN(parseInt(value, 10))) {
                return parseInt(value, 10);
            }
        }

        return 0;
    }
}
