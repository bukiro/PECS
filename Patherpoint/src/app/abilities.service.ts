import { Injectable } from '@angular/core';
import { Ability } from './Ability';
import * as json_abilities from '../assets/json/abilities';

@Injectable({
    providedIn: 'root'
})
export class AbilitiesService {
    private abilities: Ability[] = []; 
    private loading: Boolean = false;
    
    constructor() { }
    
    get_Abilities(name: string = "") {
        if (!this.still_loading()) {
            return this.abilities.filter(ability => ability.name == name || name == "");
        } else {
            return [new Ability];
        }
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        if (!this.abilities.length) {
            this.loading = true;
            this.load_Abilities();
            this.loading = false;
        }
    }

    load_Abilities() {
        this.abilities = [];
        Object.keys(json_abilities).forEach(key => {
            this.abilities.push(...json_abilities[key].map(obj => Object.assign(new Ability(), obj)));
        });
    }
}