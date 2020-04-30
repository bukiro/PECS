import { SpellCast } from './SpellCast';
import { Condition } from './Condition';
import { ConditionGain } from './ConditionGain';

export class Bloodline {
    public name: string = "";
    public spellList: string = "";
    public bloodlineSkills: string[] = [];
    public grantedSpells: SpellCast[] = [];
    public bloodlineSpells: SpellCast[] = [];
    public bloodMagic: ConditionGain[] = [];
}
