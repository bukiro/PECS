import { SkillChoice } from './SkillChoice';

export class TraditionChoice extends SkillChoice {
    public readonly _className: string = this.constructor.name;
    //The name of the class that this choice belongs to.
    //Important to identify the class's spellcasting key ability.
    public className: string = "";
    public ability: string = "";
    public abilityAvailable: 0;
    public abilityFilter: string[] = [];
    public tradition: string = "";
    public traditionAvailable: 0;
    public traditionFilter: string[] = [];
}