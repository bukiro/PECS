import { SpellCastingTypes } from '../definitions/spellCastingTypes';
import { SpellTraditions } from '../definitions/spellTraditions';

export const SpellCastingTypeFromString = (type: string): SpellCastingTypes => Object.values(SpellCastingTypes).find(castingType => castingType === type) || SpellCastingTypes[0];

export const SpellTraditionFromString = (tradition: string): SpellTraditions => Object.values(SpellTraditions).find(spellTradition => spellTradition === tradition) || SpellTraditions[0];
