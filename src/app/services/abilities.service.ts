import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import * as json_abilities from 'src/assets/json/abilities';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Injectable({
    providedIn: 'root'
})
export class AbilitiesService {
    private abilities: Ability[] = [];
    private loading = false;

    constructor(
        private extensionsService: ExtensionsService
    ) { }

    get_Abilities(name = '') {
        if (!this.still_loading()) {
            return this.abilities.filter(ability => ability.name == name || name == '');
        } else {
            return [new Ability];
        }
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        //Initialize only once.
        if (!this.abilities.length) {
            this.loading = true;
            this.load_Abilities();
            this.loading = false;
        }
    }

    load_Abilities() {
        this.abilities = [];
        const data = this.extensionsService.extend(json_abilities, 'abilities');
        Object.keys(data).forEach(key => {
            this.abilities.push(...data[key].map((obj: Ability) => Object.assign(new Ability(), obj)));
        });
        this.abilities = this.extensionsService.cleanup_Duplicates(this.abilities, 'name', 'abilities');
    }
}
