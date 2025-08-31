import { BasicRuneLevels, basicRuneLevels } from './basic-rune-levels';
import { ResilientRuneLevelNames, StrikingRuneLevelNames } from './rune-level-names';

export const resilientTitleFromLevel = (resilient: BasicRuneLevels): ResilientRuneLevelNames => {
    switch (resilient) {
        case basicRuneLevels.first:
            return 'Resilient';
        case basicRuneLevels.second:
            return 'Greater Resilient';
        case basicRuneLevels.third:
            return 'Major Resilient';
        case basicRuneLevels.none:
        default:
            return '';
    }
};

export const strikingTitleFromLevel = (striking: BasicRuneLevels): StrikingRuneLevelNames => {
    switch (striking) {
        case basicRuneLevels.first:
            return 'Striking';
        case basicRuneLevels.second:
            return 'Greater Striking';
        case basicRuneLevels.third:
            return 'Major Striking';
        case basicRuneLevels.none:
        default:
            return '';
    }
};
