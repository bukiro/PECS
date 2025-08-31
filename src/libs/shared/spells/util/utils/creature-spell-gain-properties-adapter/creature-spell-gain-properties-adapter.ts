import { computed, signal, Signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { SpellGain } from '../../models/spell-gain';
import { ComplexValueCommonAdapter } from 'src/libs/shared/evaluation/util/utils/complex-value-adapter/complex-value-common-adapter';
import { ComplexSpellGainValue } from '../../models/complex-spell-gain-value';
import { ComplexValueContext } from 'src/libs/shared/evaluation/util/models/complex-value';

export class CreatureSpellGainPropertiesAdapter {

    private readonly _cache = {
        complexEffectiveSpellLevel: new WeakMap<SpellGain, Map<number, Signal<number>>>(),
    };

    private readonly _complexValueCommonAdapter: ComplexValueCommonAdapter<ComplexSpellGainValue, ComplexValueContext>;

    constructor(
        private readonly _creature: Creature,
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this._complexValueCommonAdapter = new ComplexValueCommonAdapter(recastFns);
    }

    public effectiveChoiceSpellLevel$$(gain: SpellGain, { baseLevel }: { baseLevel: number }): Signal<number> {
        return weaklyCachedSignalWithKey(
            () => {
                if (!Object.keys(gain.complexEffectiveSpellLevel).length) {
                    return signal(baseLevel).asReadonly();
                }

                const resolved$$ = computed(() =>
                    this._complexValueCommonAdapter.resolveComplexValue$$(
                        gain.complexEffectiveSpellLevel,
                        {
                            creature: this._creature,
                            character: this._character,
                            charLevel: this._character.level(),
                        },
                    ),
                );

                return computed(() => resolved$$()().value);
            },
            { store: this._cache.complexEffectiveSpellLevel, objKey: gain, key: baseLevel },
        );
    }

}
