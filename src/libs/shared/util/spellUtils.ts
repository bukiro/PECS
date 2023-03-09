import { SpellCastingTypes } from '../definitions/spellCastingTypes';
import { SpellTraditions } from '../definitions/spellTraditions';

export const spellCastingTypeFromString = (type: string): SpellCastingTypes => Object.values(SpellCastingTypes).find(castingType => castingType === type) || SpellCastingTypes.Innate;

export const spellTraditionFromString = (tradition: string): SpellTraditions => Object.values(SpellTraditions).find(spellTradition => spellTradition === tradition) || SpellTraditions.Arcane;
