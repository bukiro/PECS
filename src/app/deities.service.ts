import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import { SpellCast } from './SpellCast';
import * as json_deities from '../assets/json/deities';
import { ExtensionsService } from './extensions.service';

@Injectable({
    providedIn: 'root'
})
export class DeitiesService {

    private deities: Deity[] = [];
    private loading: boolean = false;

    constructor(
        private extensionsService: ExtensionsService
    ) { }

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
        let data = this.extensionsService.extend(json_deities, "deities");
        Object.keys(data).forEach(key => {
            this.deities.push(...data[key].map(obj => Object.assign(new Deity(), obj)));
        });
        //Don't call reassign() because cleric spells are really the only thing we need to assign.
        this.deities.forEach(deity => {
            deity.clericSpells = deity.clericSpells.map(spell => Object.assign(new SpellCast(), spell));
        })
        this.deities = this.extensionsService.cleanup_Duplicates(this.deities, "name", "deities");
    }

}