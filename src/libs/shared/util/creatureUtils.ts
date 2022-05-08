import { CreatureSizes } from '../definitions/creatureSizes';

export function CreatureSizeName(size: number): string {
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
}
