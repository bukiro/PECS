import { CreatureTypeIds } from '../../../libs/shared/creatures/util/models/creature-type-ids';
import { CreatureTypes } from '../../../libs/shared/creatures/util/models/creature-types';

export const creatureTypeIDFromType = (creatureType: CreatureTypes): CreatureTypeIds => {
    switch (creatureType) {
        case CreatureTypes.Character:
            return CreatureTypeIds.Character;
        case CreatureTypes.AnimalCompanion:
            return CreatureTypeIds.AnimalCompanion;
        case CreatureTypes.Familiar:
            return CreatureTypeIds.Familiar;
        default:
            return CreatureTypeIds.Character;
    }
};
