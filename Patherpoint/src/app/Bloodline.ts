import { SpellCast } from './SpellCast';
import { ConditionGain } from './ConditionGain';

export class Bloodline {
    public readonly _className: string = this.constructor.name;
    public bloodMagic: ConditionGain[] = [];
    public bloodlineSkills: string[] = [];
    public bloodlineSpells: SpellCast[] = [];
    public grantedSpells: SpellCast[] = [];
    public name: string = "";
    public spellList: string = "";
    public spellSlotsUsed: number[] = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}
