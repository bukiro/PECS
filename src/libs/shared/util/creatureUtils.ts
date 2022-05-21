import { CreatureSizes } from '../definitions/creatureSizes';
import { CreatureTypeIds } from '../definitions/creatureTypeIds';

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

export const CreatureTypeIDFromType = (creatureType: 'Character' | 'Companion' | 'Familiar'): CreatureTypeIds => {
    switch (creatureType) {
        case 'Character':
            return CreatureTypeIds.Character;
        case 'Companion':
            return CreatureTypeIds.AnimalCompanion;
        case 'Familiar':
            return CreatureTypeIds.Familiar;
        default:
            return CreatureTypeIds.Character;
    }
};
