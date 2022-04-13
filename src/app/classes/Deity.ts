import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';
import { SpellCast } from 'src/app/classes/SpellCast';

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
    get_Domains(character: Character, characterService: CharacterService) {
        //Only collect the domains if $domains is empty. When this is done, the result is written into $domains.
        if (!this.$domains.length) {
            this.$domains = JSON.parse(JSON.stringify(this.domains));
            if (character.class.deity == this.name) {
                //If you have taken the Splinter Faith feat, your domains are replaced. It's not necessary to filter by level, because Splinter Faith changes domains retroactively.
                let splinterFaithFeat = characterService.get_CharacterFeatsTaken(0, 0, "Splinter Faith")[0];
                if (splinterFaithFeat) {
                    character.class.get_FeatData(0, 0, "Splinter Faith").forEach(data => {
                        this.$domains = JSON.parse(JSON.stringify(data.valueAsStringArray('domains') || []));
                    })
                }
            }
            this.$domains = this.$domains.sort()
        }
        return this.$domains;
    }
    get_AlternateDomains(character: Character, characterService: CharacterService) {
        //Only collect the alternate domains if $alternateDomains is empty. When this is done, the result is written into $alternateDomains.
        //Because some deitys don't have alternate domains, also check if $domains is the same as domains - meaning that the deity's domains are unchanged and having no alternate domains is fine.
        if (!this.$alternateDomains.length) {
            this.recreate_AlternateDomains(character, characterService);
        }
        return this.$alternateDomains;
    }
    recreate_AlternateDomains(character: Character, characterService: CharacterService) {
        this.$alternateDomains = JSON.parse(JSON.stringify(this.alternateDomains));
        if (JSON.stringify(this.$domains) != JSON.stringify(this.domains)) {
            if (character.class.deity == this.name) {
                //If you have taken the Splinter Faith feat, your alternate domains are replaced. It's not necessary to filter by level, because Splinter Faith changes domains retroactively.
                let splinterFaithFeat = characterService.get_CharacterFeatsTaken(0, 0, "Splinter Faith")[0];
                if (splinterFaithFeat) {
                    let splinterFaithDomains = [];
                    character.class.get_FeatData(0, 0, "Splinter Faith").forEach(data => {
                        splinterFaithDomains = data.valueAsStringArray('domains') || [];
                    })
                    this.$alternateDomains = this.domains.concat(this.alternateDomains).filter(domain => !splinterFaithDomains.includes(domain));
                }
            }
        }
        this.$alternateDomains.sort();
    }
    get_IsExternalDomain(domain: string) {
        return !new Set([
            ...this.domains,
            ...this.alternateDomains
        ]).has(domain);
    }
    clear_TemporaryDomains() {
        this.$domains.length = 0;
        this.$alternateDomains.length = 0;
    }
}
