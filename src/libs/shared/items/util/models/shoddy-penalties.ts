const shoddyPenalty = -2;

export type ShoddyPenalties = 0 | typeof shoddyPenalty;

export const shoddyPenalties = {
    notShoddy: 0 as ShoddyPenalties,
    shoddy: shoddyPenalty as ShoddyPenalties,
};
