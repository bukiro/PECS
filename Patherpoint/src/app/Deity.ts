import { SpellCast } from './SpellCast';

export class Deity {
    public name: string = "";
    public category: string = "";
    public alignment: string = "";
    public followerAlignments: string[] = [];
    public divineAbility: string[] = [];
    public divineAbilityFilter: string[] = [];
    public divineFont: string[] = [];
    public divineFontFilter: string[] = [];
    public divineSkill: string[] = [];
    public divineSkillFilter: string[] = [];
    public favoredWeapon: string[] = [];
    public domains: string[] = [];
    public clericSpells: SpellCast[] = [];
}
