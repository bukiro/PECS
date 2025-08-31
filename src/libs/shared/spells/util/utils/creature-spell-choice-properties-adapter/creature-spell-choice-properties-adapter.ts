import { computed, signal, Signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { SpellCasting } from '../../models/spell-casting';
import { SpellChoice } from '../../models/spell-choice';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { ComplexSpellChoiceValue } from '../../models/complex-spell-choice-value';
import { ComplexSpellChoiceValueAdapter } from '../complex-spell-choice-value-adapter/complex-spell-choice-value-adapter';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

export class CreatureSpellChoicePropertiesAdapter {

    private readonly _cache = {
        complexChoiceSpellLevel: new WeakMap<SpellCasting, WeakMap<SpellChoice, Signal<number>>>(),
        complexChoiceAvailable: new WeakMap<SpellCasting, WeakMap<SpellChoice, Signal<number>>>(),
    };

    private readonly _complexSpellChoiceValueAdapter: ComplexSpellChoiceValueAdapter;

    constructor(
        private readonly _creature: Creature,
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this._complexSpellChoiceValueAdapter = new ComplexSpellChoiceValueAdapter(recastFns);
    }

    public effectiveChoiceSpellLevel$$(choice: SpellChoice, { casting }: { casting: SpellCasting }): Signal<number> {
        let store = this._cache.complexChoiceAvailable.get(casting);

        if (!store) {
            store = new WeakMap<SpellChoice, Signal<number>>();

            this._cache.complexChoiceAvailable.set(casting, store);
        }

        return weaklyCachedSignal(
            () => {
                if (!Object.keys(choice.complexLevel).length) {
                    return signal(choice.level).asReadonly();
                }

                return this._resolveComplexChoiceParameter$$(choice.complexLevel, { choice, casting });
            },
            { store, objKey: choice },
        );
    }

    public effectiveChoiceAvailable$$(choice: SpellChoice, { casting }: { casting: SpellCasting }): Signal<number> {
        let store = this._cache.complexChoiceAvailable.get(casting);

        if (!store) {
            store = new WeakMap<SpellChoice, Signal<number>>();

            this._cache.complexChoiceAvailable.set(casting, store);
        }

        return weaklyCachedSignal(
            () => {
                if (!Object.keys(choice.complexAvailable).length) {
                    return signal(choice.available).asReadonly();
                }

                return this._resolveComplexChoiceParameter$$(choice.complexAvailable, { choice, casting });
            },
            { store, objKey: choice },
        );
    }

    private _resolveComplexChoiceParameter$$(
        parameter: ComplexSpellChoiceValue,
        { choice, casting }: { choice: SpellChoice; casting: SpellCasting },
    ): Signal<number> {
        const highestAvailableSpellLevel$$ = computed(() => casting.highestAvailableSpellLevel$$(this._character.level()));

        const resolver$$ = computed(() => {
            const charLevel = this._character.level();

            // Get the available spell level of this casting.
            // This is the highest spell level of the spell choices that are
            // available at your character level.
            // This only considers the fixed choice levels, as evaluating their complex levels would endlessly loop this method.
            const highestSpellLevelOfCasting = highestAvailableSpellLevel$$()();

            return this._complexSpellChoiceValueAdapter.resolveComplexSpellChoiceValue$$(
                parameter,
                {
                    charLevel,
                    character: this._character,
                    creature: this._creature,
                    choice,
                    highestSpellLevelOfCasting,
                },
            );
        });

        return computed(() => resolver$$()().value);
    }

}
