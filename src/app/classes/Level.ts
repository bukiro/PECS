import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';

export class Level {
    public abilityChoices: AbilityChoice[] = [];
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public number = 0;
    public skillChoices: SkillChoice[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}
