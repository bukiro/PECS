import { BasicRuneLevels } from '../definitions/basicRuneLevels';
import { ResilientRuneLevelNames, StrikingRuneLevelNames } from '../definitions/runeLevelNames';

export const ResilientTitleFromLevel = (resilient: number): string => {
    switch (resilient) {
        case BasicRuneLevels.None:
            return ResilientRuneLevelNames.None;
        case BasicRuneLevels.First:
            return ResilientRuneLevelNames.Normal;
        case BasicRuneLevels.Second:
            return ResilientRuneLevelNames.Greater;
        case BasicRuneLevels.Third:
            return ResilientRuneLevelNames.Major;
        default:
            return ResilientRuneLevelNames.None;
    }
};

export const StrikingTitleFromLevel = (striking: number): string => {
    switch (striking) {
        case BasicRuneLevels.None:
            return StrikingRuneLevelNames.None;
        case BasicRuneLevels.First:
            return StrikingRuneLevelNames.Normal;
        case BasicRuneLevels.Second:
            return StrikingRuneLevelNames.Greater;
        case BasicRuneLevels.Third:
            return StrikingRuneLevelNames.Major;
        default:
            return StrikingRuneLevelNames.None;
    }
};
