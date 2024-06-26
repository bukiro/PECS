import { SkillChoice } from 'src/app/classes/SkillChoice';

export class LoreChoice extends SkillChoice {
    public initialIncreases = 1;
    public loreDesc = '';
    public loreName = '';
    public maxRank = 0;

    public recast(): LoreChoice {
        super.recast();

        return this;
    }

    public clone(): LoreChoice {
        return Object.assign<LoreChoice, LoreChoice>(new LoreChoice(), JSON.parse(JSON.stringify(this))).recast();
    }
}
