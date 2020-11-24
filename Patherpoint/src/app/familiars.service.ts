import { Injectable } from '@angular/core';
import { Feat } from './Feat';
import * as json_abilities from '../assets/json/familiarabilities';

@Injectable({
    providedIn: 'root'
})
export class FamiliarsService {

    private familiarAbilities: Feat[] = [];
    private loading_familiarAbilities: boolean = false;
    
    constructor() { }

    still_loading() {
        return (this.loading_familiarAbilities);
    }

    get_FamiliarAbilities(name: string = "") {
        if (!this.still_loading()) {
            return this.familiarAbilities.filter(ability => ability.name.toLowerCase() == name.toLowerCase() || name == "")
        } else { return [new Feat()] }
    }
    
    initialize() {
        if (!this.familiarAbilities.length) {
            this.loading_familiarAbilities = true;
            this.load_Abilities();
            this.loading_familiarAbilities = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.familiarAbilities.forEach(ability => {
                ability.hints?.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = false;
                })
            })
        }
    }

    load_Abilities() {
        this.familiarAbilities = [];
        Object.keys(json_abilities).forEach(key => {
            this.familiarAbilities.push(...json_abilities[key].map(obj => Object.assign(new Feat(), obj)));
        });
    }

}
