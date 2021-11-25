import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { SkillChoice } from 'src/app/classes/SkillChoice';

export class LoreChoice extends SkillChoice {
    public available: number = 0;
    public id: string = "";
    public increases: SkillIncrease[] = [];
    public initialIncreases: number = 1;
    public loreDesc: string = "";
    public loreName: string = "";
    public maxRank: number = 0;
    public source: string = "";
    recast() {
        super.recast();
        return this;
    }
}
