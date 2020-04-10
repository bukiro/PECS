import { AbilityBoost } from './AbilityBoost';
import { SkillIncrease } from './SkillIncrease';

export class TraditionChoice {
    public tradition: string = "";
    public ability: string = "";
    public increases: SkillIncrease[] = [];
    public traditionFilter: string[] = [];
    public abilityFilter: string[] = [];
    public source: string = "";
    public id: string = "";
}