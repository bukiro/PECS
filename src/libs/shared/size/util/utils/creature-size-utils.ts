import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { CreatureSizes } from '../models/creature-sizes';

export function creatureSizeName(size: number): string {
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

export function applySizeChange({
    change,
    title,
    bonuses,
}: {
    change: CreatureSizes;
    title: string;
    bonuses?: Array<BonusDescription>;
}): ResultWithBonuses<CreatureSizes> {
    return {
        result: change,
        bonuses: [
            ...bonuses ?? [],
            {
                value: change,
                valueLabel: creatureSizeName(change),
                title,
                isLabelOnly: true,
            },
        ],
    };
}

export function legalSize(size: number): CreatureSizes {
    switch (size) {
        case CreatureSizes.Tiny:
            return CreatureSizes.Tiny;
        case CreatureSizes.Small:
            return CreatureSizes.Small;
        case CreatureSizes.Medium:
            return CreatureSizes.Medium;
        case CreatureSizes.Large:
            return CreatureSizes.Large;
        case CreatureSizes.Huge:
            return CreatureSizes.Huge;
        case CreatureSizes.Gargantuan:
            return CreatureSizes.Gargantuan;
        default:
            return CreatureSizes.Medium;
    }
}
