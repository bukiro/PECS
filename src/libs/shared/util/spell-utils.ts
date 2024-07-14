import { SpellCastingTypes } from '../definitions/spell-casting-types';
import { SpellTraditions } from '../definitions/spell-traditions';

export const spellCastingTypeFromString = (type: string): SpellCastingTypes => Object.values(SpellCastingTypes).find(castingType => castingType === type) || SpellCastingTypes.Innate;

export const spellTraditionFromString = (tradition: string): SpellTraditions => Object.values(SpellTraditions).find(spellTradition => spellTradition === tradition) || SpellTraditions.Arcane;
