export interface BonusDescription {
    title: string;
    value: number;
    valueLabel?: string;
    subline?: string;
    valueSubline?: number;
    type?: string;
    isBonus?: boolean;
    isPenalty?: boolean;
    isAbsolute?: boolean;
    isLabelOnly?: boolean;
}
