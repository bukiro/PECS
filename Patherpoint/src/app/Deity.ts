import { SpellCast } from './SpellCast';

export class Deity {
    public name: string = "";
    public category: string = "";
    public alignment: string = "";
    public followerAlignments: string[] = [];
    public divineAbility: string[] = [];
    public divineFont: string[] = [];
    public divineSkill: string[] = [];
    public favoredWeapon: string[] = [];
    public domains: string[] = [];
    public clericSpells: SpellCast[] = [];
}
