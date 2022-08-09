import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { SkillChoice } from 'src/app/classes/SkillChoice';

export class LoreChoice extends SkillChoice {
    public available = 0;
    public id = '';
    public increases: Array<SkillIncrease> = [];
    public initialIncreases = 1;
    public loreDesc = '';
    public loreName = '';
    public maxRank = 0;
    public source = '';

    public recast(): LoreChoice {
        super.recast();

        return this;
    }
}
