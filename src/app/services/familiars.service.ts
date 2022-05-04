import { Injectable } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import * as json_abilities from 'src/assets/json/familiarabilities';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Injectable({
    providedIn: 'root'
})
export class FamiliarsService {

    private familiarAbilities: Array<Feat> = [];
    private loading_familiarAbilities = false;

    constructor(
        private readonly extensionsService: ExtensionsService
    ) { }

    still_loading() {
        return (this.loading_familiarAbilities);
    }

    get_FamiliarAbilities(name = '') {
        if (!this.still_loading()) {
            return this.familiarAbilities.filter(ability => ability.name.toLowerCase() == name.toLowerCase() || name == '');
        } else { return [new Feat()]; }
    }

    initialize() {
        //Initialize only once, but cleanup active effects everytime thereafter.
        if (!this.familiarAbilities.length) {
            this.loading_familiarAbilities = true;
            this.load_Abilities();
            this.loading_familiarAbilities = false;
        }
    }

    reset() {
        //Disable any active hint effects when loading a character.
        this.familiarAbilities.forEach(ability => {
            ability.hints?.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            });
        });
    }

    load_Abilities() {
        this.familiarAbilities = [];
        const data = this.extensionsService.extend(json_abilities, 'familiarAbilities');
        Object.keys(data).forEach(key => {
            this.familiarAbilities.push(...data[key].map((obj: Feat) => Object.assign(new Feat(), obj).recast()));
        });
        this.familiarAbilities = this.extensionsService.cleanup_Duplicates(this.familiarAbilities, 'name', 'familiar abilities') as Array<Feat>;
    }

}
