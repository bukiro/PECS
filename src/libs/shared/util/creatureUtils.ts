import { CreatureSizes } from '../definitions/creatureSizes';
import { CreatureTypeIds } from '../definitions/creatureTypeIds';
import { CreatureTypes } from '../definitions/creatureTypes';

export const CreatureSizeName = (size: number): string => {
    switch (size) {
        case CreatureSizes.Tiny:
            return 'Tiny';
        case CreatureSizes.Small:
            return 'Small';
        case CreatureSizes.Medium:
            return 'Medium';
        case CreatureSizes.Large:
            return 'Large';
        case CreatureSizes.Huge:
            return 'Huge';
        case CreatureSizes.Gargantuan:
            return 'Gargantuan';
        default:
            return 'Medium';
    }
};

export const CreatureTypeIDFromType = (creatureType: CreatureTypes): CreatureTypeIds => {
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
