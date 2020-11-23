import { Injectable } from '@angular/core';
import { Trait } from './Trait';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Hint } from './Hint';

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
            //Some trait instances have range information after the trait name, so we allow traits that are included in the name as long as the name also contains " ft" or " d".
            return this.traits
                .filter(trait =>
                    traitName == "" ||
                    trait.name == traitName ||
                    (
                        traitName.includes(trait.name) &&
                        (
                            traitName.includes(" ft") ||
                            traitName.includes(" d")
                        )
                    )
                );
        } else {
            return [new Trait()];
        }
    }

    get_TraitsForThis(creature: Character|AnimalCompanion|Familiar, name: string) {
        if (!this.still_loading()) {
            //return all traits that are set to SHOW ON this named object and that are on any equipped equipment in your inventory
            //uses the haveOn() method of Trait that returns any equipment that has this trait
            let traits = this.traits;
            return traits.filter(trait => 
                trait.hints.find(hint => hint.showon.toLowerCase().includes(name.toLowerCase()))
                && trait.haveOn(creature).length > 0
                );
        } else {
            return []
        }
    }

    have_Trait(characterService: CharacterService, object: any, traitName: string) {
        //Find out if this object - could be anything - has this trait. Sounds easy enough, but some items get traits added by certain circumstances, so here we are.
        return ((object.get_Traits ? object.get_Traits(characterService, characterService.get_Character()) : object.traits).filter((trait: string) => trait.includes(traitName)).length) ? true : false;
    }

    still_loading() {
        return (this.loading);
    }

    load_Traits(): Observable<string[]>{
        return this.http.get<string[]>('/assets/traits.json');
    }

    initialize() {
        if (!this.traits) {
        this.loading = true;
        this.load_Traits()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.traits = this.loader.map(trait => Object.assign(new Trait(), trait));
            this.traits.forEach(trait => {
                trait.hints = trait.hints.map(hint => Object.assign(new Hint(), hint));
            })
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
