import { Injectable } from '@angular/core';
import { Trait } from './Trait';
import { CharacterService } from './character.service';
import * as json_traits from '../assets/json/traits';
import { Creature } from './Creature';
import { Hint } from './Hint';
import { ExtensionsService } from './extensions.service';
import { EffectGain } from './EffectGain';

@Injectable({
    providedIn: 'root'
})
export class TraitsService {

    private traits: Trait[] = [];
    private loading: boolean = false;
    private traitsMap = new Map<string, Trait>();

    constructor(
        private extensionsService: ExtensionsService
    ) { }

    get_TraitFromName(name: string) {
        //Returns a named trait from the map.
        return this.traitsMap.get(name.toLowerCase());
    }

    get_Traits(traitName: string = "") {
        if (!this.still_loading()) {
            //If only a name is given, try to find a feat by that name in the index map. This should be much quicker.
            if (traitName) {
                let trait = this.get_TraitFromName(traitName);
                if (trait) {
                    return [trait];
                }
            }
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

    have_Trait(characterService: CharacterService, creature: Creature, object: any, traitName: string) {
        //Find out if this object - could be anything - has this trait. Sounds easy enough, but some items get traits added by certain circumstances, so here we are.
        //Traits can have additional information, so we compare only the first word - but if the given traitName includes spaces, we compare the entire string.
        return (object.get_Traits ? object.get_Traits(characterService, creature) : object.traits)
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
        //Initialize only once.
        if (!this.traits.length) {
            this.loading = true;
            this.load_Traits();
            this.traits.forEach(trait => {
                this.traitsMap.set(trait.name.toLowerCase(), trait);
            })
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
        let data = this.extensionsService.extend(json_traits, "traits");
        Object.keys(data).forEach(key => {
            this.traits.push(...data[key].map(obj => Object.assign(new Trait(), obj)));
        });
        this.traits.forEach(trait => {
            trait.hints = trait.hints.map(hint => Object.assign(new Hint(), hint));
            trait.objectEffects = trait.objectEffects.map(hint => Object.assign(new EffectGain(), hint));
        });
        this.traits = this.extensionsService.cleanup_Duplicates(this.traits, "name", "traits");
    }

}