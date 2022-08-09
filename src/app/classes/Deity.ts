import { SpellCast } from 'src/app/classes/SpellCast';

export class Deity {
    public name = '';
    public nickname = '';
    public desc = '';
    public sourceBook = '';
    public edicts: Array<string> = [];
    public anathema: Array<string> = [];
    public areasOfConcern = '';
    public category = '';
    public alignment = '';
    public pantheonMembers: Array<string> = [];
    public followerAlignments: Array<string> = [];
    public divineAbility: Array<string> = [];
    public divineFont: Array<'Heal' | 'Harm'> = [];
    public divineSkill: Array<string> = [];
    public favoredWeapon: Array<string> = [];
    public domains: Array<string> = [];
    public alternateDomains: Array<string> = [];
    public clericSpells: Array<SpellCast> = [];
    /**
     * Store current domains here to save resources for the many queries coming from the general component
     * and the domain initiate feats.
     */
    public $domains: Array<string> = [];
    public $alternateDomains: Array<string> = [];
    public recast(): Deity {
        this.clericSpells = this.clericSpells.map(obj => Object.assign(new SpellCast(), obj).recast());

        return this;
    }

    public isDomainExternal(domain: string): boolean {
        return !new Set([
            ...this.domains,
            ...this.alternateDomains,
        ]).has(domain);
    }

    public clearTemporaryDomains(): void {
        this.$domains.length = 0;
        this.$alternateDomains.length = 0;
    }
}
