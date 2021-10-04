import { Character } from './Character';
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
    //Store current domains here to save resources for the many queries coming from the general component and the domain initiate feats.
    public $domains: string[] = [];
    public $alternateDomains: string[] = [];
    recast() {
        this.clericSpells = this.clericSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        return this;
    }
    get_Domains(character: Character) {
        //Only collect the domains if $domains is empty. When this is done, the result is written into $domains.
        if (!this.$domains.length) {
            this.$domains = JSON.parse(JSON.stringify(this.domains));
            if (character.class.deity == this.name) {
                //If you have taken the Splinter Faith feat, your domains are replaced. It's not necessary to filter by level, because Splinter Faith changes domains retroactively.
                let splinterFaithFeat = character.customFeats.find(feat => feat.name == "Splinter Faith");
                if (splinterFaithFeat) {
                    this.$domains = JSON.parse(JSON.stringify(splinterFaithFeat.data?.['domains'] as string[] || []));
                }
            }
            this.$domains = this.$domains.sort(function (a, b) {
                if (a > b) {
                    return 1;
                }
                if (a < b) {
                    return -1;
                }
                return 0;
            })
        }
        return this.$domains;
    }
    get_AlternateDomains(character: Character) {
        //Only collect the alternate domains if $alternateDomains is empty. When this is done, the result is written into $alternateDomains.
        //Because some deitys don't have alternate domains, also check if $domains is the same as domains - meaning that the deity's domains are unchanged and having no alternate domains is fine.
        if (!this.$alternateDomains.length) {
            this.$alternateDomains = JSON.parse(JSON.stringify(this.alternateDomains));
            if (JSON.stringify(this.$domains) != JSON.stringify(this.domains)) {
                if (character.class.deity == this.name) {
                    //If you have taken the Splinter Faith feat, your alternate domains are replaced. It's not necessary to filter by level, because Splinter Faith changes domains retroactively.
                    let splinterFaithFeat = character.customFeats.find(feat => feat.name == "Splinter Faith");
                    if (splinterFaithFeat) {
                        let splinterFaithDomains = splinterFaithFeat.data?.['domains'] as string[] || [];
                        this.$alternateDomains = this.domains.concat(this.alternateDomains).filter(domain => !splinterFaithDomains.includes(domain));
                    }
                }
            }
            this.$alternateDomains = this.$alternateDomains.sort(function (a, b) {
                if (a > b) {
                    return 1;
                }
                if (a < b) {
                    return -1;
                }
                return 0;
            })
        }
        return this.$alternateDomains;
    }
    get_IsExternalDomain(domain: string) {
        return !this.domains.includes(domain) && !this.alternateDomains.includes(domain);
    }
    clear_TemporaryDomains() {
        this.$domains.length = 0;
        this.$alternateDomains.length = 0;
    }
}
