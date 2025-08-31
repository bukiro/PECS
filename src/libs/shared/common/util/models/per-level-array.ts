// One T per character level (1-20), with one extra for level 0
export type PerLevelArray<T> = [
    T,
    T, T, T, T, T,
    T, T, T, T, T,
    T, T, T, T, T,
    T, T, T, T, T,
];

// One T per spell level (1-10), with one extra for level 0
export type PerSpellLevelArray<T> = [
    T,
    T, T, T, T, T,
    T, T, T, T, T,
];
