import { Injectable } from '@angular/core';
import { Deity } from 'src/app/classes/Deity';
import * as json_deities from 'src/assets/json/deities';
import * as json_domains from 'src/assets/json/domains';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { Domain } from 'src/app/classes/Domain';
import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';

@Injectable({
    providedIn: 'root',
})
export class DeitiesService {

    private deities: Array<Deity> = [];
    private domains: Array<Domain> = [];
    private loading = false;
    //The character's deity or deities get loaded into $characterDeities whenever it is queried and empty.
    private $characterDeities: Array<{ deity: Deity; source: string; level: number }> = [];
    private readonly deitiesMap = new Map<string, Deity>();

    constructor(
        private readonly extensionsService: ExtensionsService,
    ) { }

    private get_ReplacementDeity(name?: string): Deity {
        return Object.assign(new Deity(), { name: 'Deity not found', desc: `${ name ? name : 'The requested deity' } does not exist in the deities list.` });
    }

    get_DeityFromName(name: string): Deity {
        //Returns a named deity from the map.
        return this.deitiesMap.get(name.toLowerCase()) || this.get_ReplacementDeity(name);
    }

    get_CharacterDeities(characterService: CharacterService, character: Character, source = '', level: number = character.level): Array<Deity> {
        if (!this.$characterDeities.length && character.class.deity) {
            //Recreate the character deities list from the main deity and the Syncretism feat data.
            const mainDeity = this.get_Deities(character.class.deity)[0];

            if (mainDeity) {
                this.$characterDeities.push({ deity: mainDeity, source: 'main', level: 1 });

                const syncretismFeat = characterService.get_CharacterFeatsTaken(0, level, { featName: 'Syncretism' }).length;

                if (syncretismFeat) {
                    const data = character.class.filteredFeatData(0, 0, 'Syncretism')[0];
                    const syncretismDeity = data.valueAsString('deity');

                    if (syncretismDeity) {
                        const levelNumber = data.level;
                        const secondDeity = this.get_Deities(syncretismDeity)[0];

                        if (secondDeity) {
                            this.$characterDeities.push({ deity: secondDeity, source: 'syncretism', level: levelNumber });
                        }
                    }
                }
            }
        }

        return this.$characterDeities.filter(deitySet => deitySet.level <= level && (!source || deitySet.source == source)).map(deitySet => deitySet.deity);
    }

    clear_CharacterDeities(): void {
        this.$characterDeities.length = 0;
    }

    get_Deities(name = ''): Array<Deity> {
        if (!this.still_loading()) {
            //If a name is given, try to find a deity by that name in the index map. This should be much quicker.
            if (name) {
                return [this.get_DeityFromName(name)];
            } else {
                return this.deities.filter(deity => deity.name.toLowerCase() == name.toLowerCase() || name == '');
            }
        } else { return [this.get_ReplacementDeity()]; }
    }

    get_Domains(name = ''): Array<Domain> {
        if (!this.still_loading()) {
            return this.domains.filter(domain => domain.name.toLowerCase() == name.toLowerCase() || name == '');
        } else { return [new Domain()]; }
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        this.loading = true;
        this.load_Deities();
        this.load_Domains();
        this.deitiesMap.clear();
        this.deities.forEach(deity => {
            this.deitiesMap.set(deity.name.toLowerCase(), deity);
        });
        this.loading = false;
    }

    reset() {
        this.clear_CharacterDeities();
    }

    load_Deities() {
        this.deities = [];

        const data = this.extensionsService.extend(json_deities, 'deities');

        Object.keys(data).forEach(key => {
            this.deities.push(...data[key].map((obj: Deity) => Object.assign(new Deity(), obj).recast()));
        });
        this.deities = this.extensionsService.cleanup_Duplicates(this.deities, 'name', 'deities') as Array<Deity>;
    }

    load_Domains() {
        this.domains = [];

        const data = this.extensionsService.extend(json_domains, 'domains');

        Object.keys(data).forEach(key => {
            this.domains.push(...data[key].map((obj: Domain) => Object.assign(new Domain(), obj).recast()));
        });
        this.domains = this.extensionsService.cleanup_Duplicates(this.domains, 'name', 'domains') as Array<Domain>;
    }

}
