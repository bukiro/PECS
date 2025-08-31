import { SpellCastingTypes } from './spell-casting-types';
import { SpellTraditions } from './spell-traditions';

export interface SpellCastingFilter {
    classNames?: Array<string>;
    traditions?: Array<SpellTraditions>;
    castingTypes?: Array<SpellCastingTypes>;
}
