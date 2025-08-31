export type SpellTraditions = 'Arcane' | 'Divine' | 'Occult' | 'Primal' | 'Focus';

export const spellTraditions: { arcane: SpellTraditions; divine: SpellTraditions; occult: SpellTraditions; primal: SpellTraditions; focus: SpellTraditions } = {
    arcane: 'Arcane',
    divine: 'Divine',
    occult: 'Occult',
    primal: 'Primal',
    focus: 'Focus',
};

export function normalizeSpellTradition(tradition: string): SpellTraditions | undefined {
    switch (tradition){
        case spellTraditions.arcane:
            return spellTraditions.arcane;
        case spellTraditions.divine:
            return spellTraditions.divine;
        case spellTraditions.occult:
            return spellTraditions.occult;
        case spellTraditions.primal:
            return spellTraditions.primal;
        case spellTraditions.focus:
            return spellTraditions.focus;
        default: return undefined;
    }
}
