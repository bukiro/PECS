export type SpellCastingTypes = 'Innate' | 'Focus' | 'Spontaneous' | 'Prepared';

export const spellCastingTypes: { innate: SpellCastingTypes; focus: SpellCastingTypes; spontaneous: SpellCastingTypes; prepared: SpellCastingTypes } = {
    innate: 'Innate',
    focus: 'Focus',
    spontaneous: 'Spontaneous',
    prepared: 'Prepared',
};

export function normalizeSpellCastingType(castingType: string): SpellCastingTypes | undefined {
    switch (castingType){
        case spellCastingTypes.innate:
            return spellCastingTypes.innate;
        case spellCastingTypes.focus:
            return spellCastingTypes.focus;
        case spellCastingTypes.spontaneous:
            return spellCastingTypes.spontaneous;
        case spellCastingTypes.prepared:
            return spellCastingTypes.prepared;
        default: return undefined;
    }
}
