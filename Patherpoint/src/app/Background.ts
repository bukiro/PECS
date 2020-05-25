import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { FeatChoice } from './FeatChoice';

export class Background {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public feat: string = "";
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public loreName: string = "";
    public name: string = "";
    public skill: string = "";
    public skillChoices: SkillChoice[] = [];
    public specialLore: string = "";
    public subType: string = "";
    public subTypes: boolean = false;
    public superType: string = "";
    public sourceBook: string = "";
    public region: string = "";
    public prerequisites: string = "";
    public inputRequired: string = "";
    public traits: string[] = [];
}