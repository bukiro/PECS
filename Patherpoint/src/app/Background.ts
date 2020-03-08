import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { FeatChoice } from './FeatChoice';

export class Background {
    public name: string = "";
    public subTypes: Background[] = [];
    public subType: string = "";
    public superType: string = "";
    public abilityChoices: AbilityChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public skill: string = "";
    public loreName: string = "";
    public specialLore: string = "";
    public feat: string = "";
}