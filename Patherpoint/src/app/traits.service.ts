import { Injectable } from '@angular/core';
import { Trait } from './Trait';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';

@Injectable({
    providedIn: 'root'
})
export class TraitsService {

    private traits: Trait[];
    private loader;
    private loading: boolean = false;

    constructor(
        private http: HttpClient
    ) { }

    get_Traits(traitName: string = "") {
        if (!this.still_loading()) {
            //Some trait instances have more information after the trait name, so we allow trait.name == name.split(" ")[0] in the filter to compare only the first word.
            //Because there is one (1) trait with two words in the database, we also have to allow trait.name == name to find that one.
            return this.traits.filter(trait => trait.name == traitName || trait.name == traitName.split(" ")[0] || traitName == "");
        } else {
            return [new Trait()];
        }
    }

    get_TraitsForThis(creature: Character|AnimalCompanion, name: string) {
        if (!this.still_loading()) {
            //return all traits that are set to SHOW ON this named object and that are on any equipped equipment in your inventory
            //uses the haveOn() method of Trait that returns any equipment that has this trait
            let traits = this.traits;
            return traits.filter(trait => 
                trait.showon == name
                && trait.haveOn(creature).length > 0
                );
        } else {return []}
    }

    have_Trait(characterService: CharacterService, object: any, traitName: string) {
        //Find out if this object - could be anything - has this trait. Sounds easy enough, but some items get traits added by certain circumstances, so here we are.
        return ((object.get_Traits ? object.get_Traits(characterService) : object.traits).filter((trait: string) => trait.indexOf(traitName) > -1).length) ? true : false;
    }

    still_loading() {
        return (this.loading);
    }

    load_Traits(): Observable<String[]>{
        return this.http.get<String[]>('/assets/traits.json');
    }

    initialize() {
        if (!this.traits) {
        this.loading = true;
        this.load_Traits()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.traits = this.loader.map(trait => Object.assign(new Trait(), trait));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
