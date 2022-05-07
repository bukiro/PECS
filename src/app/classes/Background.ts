import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';

export class Background {
    public desc = '';
    public abilityChoices: Array<AbilityChoice> = [];
    public feat = '';
    public featChoices: Array<FeatChoice> = [];
    public loreChoices: Array<LoreChoice> = [];
    public loreName = '';
    public name = '';
    public skill = '';
    public skillChoices: Array<SkillChoice> = [];
    public specialLore = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public sourceBook = '';
    public region = '';
    public adventurePath = '';
    public prerequisites = '';
    public inputRequired = '';
    public traits: Array<string> = [];
    public recast(): Background {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());

        return this;
    }
}
