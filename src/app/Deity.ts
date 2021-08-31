import { SpellCast } from './SpellCast';

export class Deity {
    public name: string = "";
    public nickname: string = "";
    public desc: string = "";
    public sourceBook: string = "";
    public edicts: string[] = [];
    public anathema: string[] = [];
    public areasOfConcern: string = "";
    public category: string = "";
    public alignment: string = "";
    public pantheonMembers: string[] = [];
    public followerAlignments: string[] = [];
    public divineAbility: string[] = [];
    public divineFont: string[] = [];
    public divineSkill: string[] = [];
    public favoredWeapon: string[] = [];
    public domains: string[] = [];
    public alternateDomains: string[] = [];
    public clericSpells: SpellCast[] = [];
}
