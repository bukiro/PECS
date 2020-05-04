import { SkillIncrease } from './SkillIncrease';
import { SkillChoice } from './SkillChoice';

export class LoreChoice extends SkillChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    public id: string = "";
    public increases: SkillIncrease[] = [];
    public initialIncreases: number = 1;
    public loreDesc: string = "";
    public loreName: string = "";
    public maxRank: number = 0;
    public source: string = "";
}
