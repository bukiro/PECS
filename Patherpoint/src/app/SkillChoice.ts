export interface SkillChoice {
    available: number;
    increases: any[];
    type: string;
    //maxRank: the highest rank you are allowed to achieve with this choice.
    //This means that only skills are allowed which currently have maxRank - 2 !
    maxRank: number;
    source: string;
    id: number;
}
