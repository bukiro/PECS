import { SkillIncrease } from './SkillIncrease';

export class SkillChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    public filter: string[] = [];
    public id: string = "";
    public increases: SkillIncrease[] = [];
    //maxRank: the highest rank you are allowed to achieve with this choice.
    //This means that only skills are allowed which currently have maxRank-2 !
    public maxRank: number = 8;
    public source: string = "";
    public type: string = "";
}
