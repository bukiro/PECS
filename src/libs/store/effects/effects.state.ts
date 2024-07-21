import { Effect } from 'src/app/classes/effects/effect';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';

export interface EffectsState {
    effects: Record<CreatureTypeIds, Array<Effect>>;
}
