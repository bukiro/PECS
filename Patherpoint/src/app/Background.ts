import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';

export class Background {
    public name: string = "";
    public abilityChoices: AbilityChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public skill: string = "";
    public loreName: string = "";
    public specialLore: string = "";
    public feat: string = "";
}