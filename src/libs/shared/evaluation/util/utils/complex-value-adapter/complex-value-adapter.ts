import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import {
    ComplexValueArithmetic,
    ComplexValueContext,
    ComplexValueExact,
    ComplexValueListIndex,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    ComplexValueResult,
    DomainValue,
    DualArithmeticValue,
    MultiArithmeticValue,
} from '../../models/complex-value';
import { computed, Signal } from '@angular/core';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Character } from 'src/libs/shared/character/util/models/character';
import { ComplexValueCommonAdapter } from './complex-value-common-adapter';

export type ComplexValue =
    DomainValue<ComplexValue>
    | ComplexValueExact
    | ComplexValueMeetsAll<ComplexValue>
    | ComplexValueMeetsAny<ComplexValue>
    | ComplexValueArithmetic<ComplexValue>
    | ComplexValueListIndex<ComplexValue>;

// TODO:
// This service is more of a placeholder / POC. There is not going to be a generic ComplexValue
// - rather there will be ComplexFeatRequirement, EffectValue, ConditionValue, SpellChoiceValue...
export class ComplexValueAdapter {

    private readonly _complexValueCommonAdapter: ComplexValueCommonAdapter<ComplexValue, ComplexValueContext>;

    private readonly _cache = {
        resolveComplexValue: new WeakMap<ComplexValue, Map<string, Signal<ComplexValueResult>>>(),
        resolveMeetsAll: new WeakMap<ComplexValueMeetsAll<ComplexValue>, Map<string, Signal<ComplexValueResult>>>(),
        resolveMeetsAny: new WeakMap<ComplexValueMeetsAny<ComplexValue>, Map<string, Signal<ComplexValueResult>>>(),
        resolveDualArithmetic: new WeakMap<DualArithmeticValue<ComplexValue>, Map<string, Signal<ComplexValueResult>>>(),
        resolveMultiArithmetic: new WeakMap<MultiArithmeticValue<ComplexValue>, Map<string, Signal<ComplexValueResult>>>(),
        resolveListIndex: new WeakMap<ComplexValueListIndex<ComplexValue>, Map<string, Signal<ComplexValueResult>>>(),
    };

    constructor(
        private readonly _creature: Creature,
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this._complexValueCommonAdapter = new ComplexValueCommonAdapter(recastFns);
    }

    public resolveComplexValue$$(
        complexValue: ComplexValue,
        charLevel: number,
    ): Signal<ComplexValueResult> {
        const key = `charLevel=${ charLevel }`;

        return weaklyCachedSignalWithKey(
            () => {
                const charLevel$$ = this._character.levelOrCurrent$$(charLevel);
                const creature = this._creature;
                const character = this._character;

                const result$$ = computed(() => {
                    const effectiveCharLevel = charLevel$$();

                    const queryContext: ComplexValueContext = {
                        charLevel: effectiveCharLevel,
                        creature,
                        character,
                    };

                    return this._complexValueCommonAdapter.resolveComplexValue$$(complexValue, queryContext);
                });

                return computed(() => result$$()());
            },
            { store: this._cache.resolveComplexValue, objKey: complexValue, key },
        );
    }
}
