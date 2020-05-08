import { SpellCast } from './SpellCast';
import { ConditionGain } from './ConditionGain';
import { SkillChoice } from './SkillChoice';

export class Bloodline {
    public readonly _className: string = this.constructor.name;
    public bloodMagic: ConditionGain[] = [];
    public bloodlineSkills: string[] = [];
    public bloodlineSpells: SpellCast[] = [];
    public grantedSpells: SpellCast[] = [];
    public skillChoices: SkillChoice[] = [];
    public name: string = "";
    constructor(public spellList: "Arcane"|"Divine"|"Occult"|"Primal") {}
}
