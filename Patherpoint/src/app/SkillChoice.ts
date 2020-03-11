import { SkillIncrease } from './SkillIncrease';

export class SkillChoice {
    public available: number = 0;
    public increases: SkillIncrease[] = [];
    public filter: string[] = [];
    public type: string = "";
    //maxRank: the highest rank you are allowed to achieve with this choice.
    //This means that only skills are allowed which currently have maxRank-2 !
    public maxRank: number = 8;
    public source: string = "";
    public id: string = "";
}
