export type BonusTypes = 'untyped' | 'item' | 'circumstance' | 'status' | 'proficiency';

export const bonusTypes: {
    untyped: BonusTypes;
    item: BonusTypes;
    circumstance: BonusTypes;
    status: BonusTypes;
    proficiency: BonusTypes;
} = {
    untyped: 'untyped',
    item: 'item',
    circumstance: 'circumstance',
    status: 'status',
    proficiency: 'proficiency',
};
