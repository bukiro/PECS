import { CreatureSizes } from '../definitions/creature-sizes';
import { CreatureTypeIds } from '../definitions/creature-type-ids';
import { CreatureTypes } from '../definitions/creature-types';

export const creatureSizeName = (size: number): string => {
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
