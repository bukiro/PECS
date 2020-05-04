import { SkillChoice } from './SkillChoice';

export class TraditionChoice extends SkillChoice {
    public readonly _className: string = this.constructor.name;
    public ability: string = "";
    public abilityAvailable: 0;
    public abilityFilter: string[] = [];
    public tradition: string = "";
    public traditionAvailable: 0;
    public traditionFilter: string[] = [];
}