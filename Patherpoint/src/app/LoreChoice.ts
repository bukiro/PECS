import { SkillIncrease } from './SkillIncrease';
import { SkillChoice } from './SkillChoice';

export class LoreChoice extends SkillChoice {
    public available: number = 0;
    public increases: SkillIncrease[] = [];
    public initialIncreases: number = 1;
    public maxRank: number = 0;
    public loreName: string = "";
    public loreDesc: string = "";
    public source: string = "";
    public id: string = "";
}
