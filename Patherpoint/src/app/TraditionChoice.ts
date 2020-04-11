import { SkillChoice } from './SkillChoice';

export class TraditionChoice extends SkillChoice {
    public traditionAvailable: 0;
    public abilityAvailable: 0;
    public tradition: string = "";
    public ability: string = "";
    public traditionFilter: string[] = [];
    public abilityFilter: string[] = [];
}