const firstRuneLevel = 1;
const secondRuneLevel = 2;
const thirdRuneLevel = 3;

export type BasicRuneLevels = 0 | typeof firstRuneLevel | typeof secondRuneLevel | typeof thirdRuneLevel;

export const basicRuneLevels: { none: BasicRuneLevels; first: BasicRuneLevels; second: BasicRuneLevels; third: BasicRuneLevels } = {
    none: 0,
    first: firstRuneLevel,
    second: secondRuneLevel,
    third: thirdRuneLevel,
};
