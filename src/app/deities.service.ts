import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import { SpellCast } from './SpellCast';
import * as json_deities from '../assets/json/deities';

@Injectable({
    providedIn: 'root'
})
export class DeitiesService {

    private deities: Deity[] = [];
    private loading: boolean = false;
    
    constructor() { }

    get_Deities(name: string = "") {
        if (!this.still_loading()) {
            return this.deities.filter(deity => deity.name.toLowerCase() == name.toLowerCase() || name == "")
        } else { return [new Deity()] }
    }

    still_loading() {
        return (this.loading);
    }
  
    initialize() {
        if (!this.deities.length) {
            this.loading = true;
            this.load_Deities();
            this.loading = false;
        }
    }

    load_Deities() {
        this.deities = [];
        Object.keys(json_deities).forEach(key => {
            this.deities.push(...json_deities[key].map(obj => Object.assign(new Deity(), obj)));
        });
        //Don't call reassign() because cleric spells are really the only thing we need to assign.
        this.deities.forEach(deity => {
            deity.clericSpells = deity.clericSpells.map(spell => Object.assign(new SpellCast(), spell));
        })
    }

}