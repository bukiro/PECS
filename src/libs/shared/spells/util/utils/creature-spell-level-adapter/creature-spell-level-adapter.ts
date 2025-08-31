import { computed, signal, Signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { Spell } from '../../models/spell';
import { SpellGain } from '../../models/spell-gain';
import { spellTraditions } from '../../models/spell-traditions';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';

export class CreatureSpellLevelAdapter {

    private readonly _cache = {
        spellLevel: new WeakMap<SpellGain, Map<string, Signal<number>>>(),
        spellLevelFromBaseLevel: new WeakMap<Spell, Map<number, Signal<number>>>(),
    };

    constructor(
        private readonly _creature: Creature,
    ) { }

    public spellLevel$$(
        gain: SpellGain,
        { baseLevel }: { baseLevel: number },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<number> {
        const key = `baseLevel=${ baseLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return weaklyCachedSignalWithKey(
            () => {
                const effectTargets$$ = computed(() => {
                    const spell = gain.originalSpell$$();

                    const effectTargets = [
                        'Spell Levels',
                        `${ spell.name } Spell Level`,
                    ];

                    if (stringsIncludeCaseInsensitive(spell.traditions, spellTraditions.focus)) {
                        effectTargets.push('Focus Spell Levels');
                    }

                    if (stringsIncludeCaseInsensitive(spell.traits, 'Cantrip')) {
                        effectTargets.push('Cantrip Spell Levels');
                    }

                    return effectTargets;
                });

                const absoluteEffects$$ = computed(() =>
                    options.excludeTemporary
                        ? signal([]).asReadonly()
                        : this._creature.effectsAdapter.absoluteEffectsOnThese$$(effectTargets$$()),
                );

                const relativeEffects$$ = computed(() =>
                    options.excludeTemporary
                        ? signal([]).asReadonly()
                        : this._creature.effectsAdapter.relativeEffectsOnThese$$(effectTargets$$()),
                );

                // Some spellgains come with a level override.
                const gainBaseLevel$$ =
                    this._creature.magicAdapter.spellGainPropertiesAdapter.effectiveChoiceSpellLevel$$(gain, { baseLevel });

                // Replace the spell level for cantrips and focus spells
                const gainLevel$$ = computed(() => {
                    const spell = gain.originalSpell$$();

                    return this.spellLevelFromBaseLevel$$(spell, gainBaseLevel$$());
                });

                return computed(() => {
                    const spell = gain.originalSpell$$();
                    const gainLevel = gainLevel$$()();

                    if (options.excludeTemporary) {
                        return Math.max(gainLevel, spell.levelreq, 0);
                    }

                    // Absolute effects can't set a set a spell to a level lower than 1.
                    const absoluteEffects = absoluteEffects$$()().filter(({ setValueNumerical }) => setValueNumerical > 0);
                    const relativeEffects = relativeEffects$$()();

                    const levelWithEffects = applyEffectsToValue(
                        gainLevel,
                        {
                            absoluteEffects,
                            relativeEffects,
                        },
                    ).result;

                    //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
                    return Math.max(levelWithEffects, spell.levelreq, 0);
                });
            },
            { store: this._cache.spellLevel, objKey: gain, key },
        );
    }

    public spellLevelFromBaseLevel$$(spell: Spell, baseLevel: number): Signal<number> {
        return weaklyCachedSignalWithKey(
            () => computed(() => {
                const isCantrip = baseLevel === 0 && stringsIncludeCaseInsensitive(spell.traits, 'Cantrip');
                const isFocusSpell = baseLevel === -1;

                let resultingLevel = baseLevel;

                // Focus spells and cantrips are automatically heightened to your maximum available spell level,
                // unless a level is already set.
                if (isCantrip || isFocusSpell) {
                    resultingLevel = this._creature.magicAdapter.maxPersonalSpellLevel$$();
                }

                // The spell level can't drop below its minimum level.
                resultingLevel = Math.max(resultingLevel, (spell.levelreq || 0));

                return resultingLevel;
            }),
            { store: this._cache.spellLevelFromBaseLevel, objKey: spell, key: baseLevel },
        );
    }

}
