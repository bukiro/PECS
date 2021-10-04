import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import * as json_deities from '../assets/json/deities';
import * as json_domains from '../assets/json/domains';
import { ExtensionsService } from './extensions.service';
import { Domain } from './Domain';
import { Character } from './Character';
import { TypeService } from './type.service';

@Injectable({
    providedIn: 'root'
})
export class DeitiesService {

    private deities: Deity[] = [];
    private domains: Domain[] = [];
    private loading: boolean = false;
    //The character's deity or deities get loaded into $characterDeities whenever it is queried and empty.
    private $characterDeities: { deity: Deity, source: string, level: number }[] = [];

    constructor(
        private extensionsService: ExtensionsService,
        private typeService: TypeService
    ) { }

    get_CharacterDeities(character: Character, source: string = "", level: number = character.level) {
        if (!this.$characterDeities.length && character.class.deity) {
            //Recreate the character deities list from the main deity and the Syncretism feat.
            let mainDeity = this.get_Deities(character.class.deity)[0];
            if (mainDeity) {
                this.$characterDeities.push({ deity: mainDeity, source: "main", level: 1 });
                let syncretismFeat = character.customFeats.find(feat => feat.name == "Syncretism" && feat.data["deity"]);
                if (syncretismFeat) {
                    let levelNumber = 0;
                    character.class.levels.forEach(level => {
                        level.featChoices.forEach(choice => {
                            if (choice.feats.some(feat => feat.name == "Syncretism")) {
                                levelNumber = level.number;
                            }
                        })
                    })
                    let secondDeity = this.get_Deities(syncretismFeat.data["deity"])[0];
                    if (secondDeity) {
                        this.$characterDeities.push({ deity: secondDeity, source: "syncretism", level: levelNumber });
                    }
                }
            }
        }
        return this.$characterDeities.filter(deitySet => deitySet.level <= level && (!source || deitySet.source == source)).map(deitySet => deitySet.deity);
    }

    clear_CharacterDeities() {
        this.$characterDeities.length = 0;
    }

    get_Deities(name: string = "") {
        if (!this.still_loading()) {
            return this.deities.filter(deity => deity.name.toLowerCase() == name.toLowerCase() || name == "")
        } else { return [new Deity()] }
    }

    get_Domains(name: string = "") {
        if (!this.still_loading()) {
            return this.domains.filter(domain => domain.name.toLowerCase() == name.toLowerCase() || name == "")
        } else { return [new Domain()] }
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        //Initialize only once, but clear the character deities list when the character changes.    
        this.$characterDeities.length = 0;
        if (!this.deities.length) {
            this.loading = true;
            this.load_Deities();
            this.load_Domains();
            this.loading = false;
        }
    }

    load_Deities() {
        this.deities = [];
        let data = this.extensionsService.extend(json_deities, "deities");
        Object.keys(data).forEach(key => {
            this.deities.push(...data[key].map(obj => Object.assign(new Deity(), obj).recast()));
        });
        this.deities = this.extensionsService.cleanup_Duplicates(this.deities, "name", "deities");
    }

    load_Domains() {
        this.domains = [];
        let data = this.extensionsService.extend(json_domains, "domains");
        Object.keys(data).forEach(key => {
            this.domains.push(...data[key].map(obj => Object.assign(new Domain(), obj)));
        });
        this.domains = this.extensionsService.cleanup_Duplicates(this.domains, "name", "domains");
    }

}