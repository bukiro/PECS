interface DiamondLetter {
    letter: string;
    highlighted: boolean;
    tooltip?: string;
}

export type DiamondLetters = [
    DiamondLetter,
    DiamondLetter,
    DiamondLetter,
    DiamondLetter
];
