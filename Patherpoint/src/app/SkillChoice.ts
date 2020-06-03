import { SkillIncrease } from './SkillIncrease';

export class SkillChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    public filter: string[] = [];
    public id: string = "";
    public increases: SkillIncrease[] = [];
    //If insertLevel is set, this SkillChoice is placed at the designated class level when granted by a feat.
    // I.e. if a feat contains a SkillChoice with insertLevel = 5, the choice is added to level 5 regardless of when the feat was taken.
    public insertLevel: number = 0;
    //If insertClass is set, this SkillChoice is only granted by a feat if the character class name matches this name.
    // This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.) that don't give certain benefits when multiclassing.
    public insertClass: string = "";
    //maxRank: the highest rank you are allowed to achieve with this choice.
    //This means that only skills are allowed which currently have maxRank-2 !
    public maxRank: number = 8;
    public source: string = "";
    public type: string = "";
}
