export interface SkillIncrease {
    available: number;
    applied: number;
    type: string;
    //maxRank: the highest rank you are allowed to achieve with this increase.
    //This means that only skills are allowed which currently have maxRank - 2 !
    maxRank: number;
    source: string;
}
