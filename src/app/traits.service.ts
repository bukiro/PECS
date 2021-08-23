import { Injectable } from '@angular/core';
import { Trait } from './Trait';
import { CharacterService } from './character.service';
import * as json_traits from '../assets/json/traits';
import { Creature } from './Creature';
import { Hint } from './Hint';

@Injectable({
    providedIn: 'root'
})
export class TraitsService {

    private traits: Trait[] = [];
    private loading: boolean = false;

    constructor() { }

    get_Traits(traitName: string = "") {
        if (!this.still_loading()) {
            //Some trait instances have information after the trait name, so we allow traits that are included in the name as long as they have the dynamic attribute.
            let traits = this.traits
                .filter(trait =>
                    traitName == "" ||
                    trait.name == traitName ||
                    (
                        traitName.includes(trait.name + " ") &&
                        trait.dynamic
                    )
                )
            if (traits.length) {
                return traits;
            } else {
                console.error("Trait missing: " + traitName)
                return [Object.assign(new Trait(), { name: ("Trait missing: " + traitName), desc: "This trait does not exist in the database." })]
            }
        } else {
            return [new Trait()];
        }
    }

    get_TraitsForThis(creature: Creature, name: string) {
        if (!this.still_loading()) {
            //Return all traits that are set to SHOW ON this named object and that are on any equipped equipment in your inventory
            //uses the haveOn() method of Trait that returns any equipment that has this trait
            let traits = this.traits;
            return traits.filter(trait =>
                trait.hints.some(hint =>
                    hint.showon.split(",").some(showon =>
                        showon.trim().toLowerCase() == name.toLowerCase() ||
                        showon.trim().toLowerCase() == (creature.type + ":" + name).toLowerCase() ||
                        (
                            name.toLowerCase().includes("lore") &&
                            showon.trim().toLowerCase() == "lore"
                        )
                    )
                )
                && trait.haveOn(creature).length > 0
            )
        } else {
            return []
        }
    }

    have_Trait(characterService: CharacterService, object: any, traitName: string) {
        //Find out if this object - could be anything - has this trait. Sounds easy enough, but some items get traits added by certain circumstances, so here we are.
        //Traits can have additional information, so we compare only the first word - but if the given traitName includes spaces, we compare the entire string.
        return (object.get_Traits ? object.get_Traits(characterService, characterService.get_Character()) : object.traits)
            .some((trait: string) =>
                (
                    traitName.includes(" ") &&
                    traitName == trait
                ) ||
                (
                    !traitName.includes(" ") &&
                    trait.split(" ")[0].toLowerCase() == traitName.toLowerCase()
                )
            )
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        if (!this.traits.length) {
            this.loading = true;
            this.load_Traits();
            this.loading = false;
        } else {
            this.traits.forEach(trait => {
                trait.hints?.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
    }

    load_Traits() {
        this.traits = [];
        Object.keys(json_traits).forEach(key => {
            this.traits.push(...json_traits[key].map(obj => Object.assign(new Trait(), obj)));
            this.traits.forEach(trait => {
                trait.hints = trait.hints.map(hint => Object.assign(new Hint(), hint));
            });
        });
    }

}