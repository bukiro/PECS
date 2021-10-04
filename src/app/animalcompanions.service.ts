import { Injectable } from '@angular/core';
import { AnimalCompanion } from './AnimalCompanion';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { SavegameService } from './savegame.service';
import * as json_ancestries from '../assets/json/animalcompanions';
import * as json_levels from '../assets/json/animalcompanionlevels';
import * as json_specializations from '../assets/json/animalcompanionspecializations';
import { ExtensionsService } from './extensions.service';
import { TypeService } from './type.service';


@Injectable({
    providedIn: 'root'
})
export class AnimalCompanionsService {

    private companionAncestries: AnimalCompanionAncestry[] = [];
    private companionLevels: AnimalCompanionLevel[] = [];
    private companionSpecializations: AnimalCompanionSpecialization[] = [];
    private loading_ancestries: boolean = false;
    private loading_levels: boolean = false;
    private loading_specializations: boolean = false;

    constructor(
        private extensionsService: ExtensionsService,
        private typeService: TypeService
    ) { }

    get_CompanionTypes(name: string = "") {
        if (!this.still_loading()) {
            return this.companionAncestries.filter(animalCompanion => animalCompanion.name == name || name == "");
        } else { return [new AnimalCompanionAncestry()] }
    }

    get_CompanionLevels() {
        if (!this.still_loading()) {
            return this.companionLevels;
        } else { return [new AnimalCompanionLevel()] }
    }

    get_CompanionSpecializations(name: string = "") {
        if (!this.still_loading()) {
            return this.companionSpecializations.filter(spec => spec.name == name || name == "");
        } else { return [new AnimalCompanionSpecialization()] }
    }

    restore_AncestryFromSave(ancestry: AnimalCompanionAncestry) {
        if (ancestry.name) {
            let libraryObject = this.get_CompanionTypes(ancestry.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    ancestry = this.typeService.merge(libraryObject, ancestry);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        return ancestry;
    }

    clean_AncestryForSave(ancestry: AnimalCompanionAncestry) {
        if (ancestry.name) {
            let libraryObject = this.get_CompanionTypes(ancestry.name)[0];
            if (libraryObject) {
                Object.keys(ancestry).forEach(key => {
                    if (!["name", "_className"].includes(key)) {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify(ancestry[key]) == JSON.stringify(libraryObject[key])) {
                            delete ancestry[key];
                        }
                    }
                })
            }
        }
        return ancestry;
    }

    restore_LevelsFromSave($class: AnimalCompanionClass) {
        if ($class.levels) {
            let libraryObject = this.get_CompanionLevels();
            if (libraryObject) {
                for (let index = 0; index < $class.levels.length; index++) {
                    //Map the restored object onto the library object and keep the result.
                    try {
                        $class.levels = this.typeService.merge(libraryObject, $class.levels);
                    } catch (e) {
                        console.log("Failed reassigning: " + e)
                    }
                }
            }
        }
        return $class;
    }

    clean_LevelsForSave($class: AnimalCompanionClass) {
        if ($class.levels) {
            let libraryObject = this.get_CompanionLevels();
            if (libraryObject) {
                for (let index = 0; index < $class.levels.length; index++) {
                    Object.keys($class.levels[index]).forEach(key => {
                        if (!["name", "_className"].includes(key)) {
                            //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                            //If they have the same value, delete the property from the item - it can be recovered during loading from the database.
                            if (JSON.stringify($class.levels[index][key]) == JSON.stringify(libraryObject[index][key])) {
                                delete $class.levels[index][key];
                            }
                        }
                    })
                }

            }
        }
        return $class;
    }

    restore_SpecializationFromSave(spec: AnimalCompanionSpecialization) {
        if (spec.name) {
            let libraryObject = this.get_CompanionSpecializations(spec.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    spec = this.typeService.merge(libraryObject, spec);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        return spec;
    }

    clean_SpecializationForSave(spec: AnimalCompanionSpecialization) {
        if (spec.name) {
            let libraryObject = this.get_CompanionSpecializations(spec.name)[0];
            if (libraryObject) {
                Object.keys(spec).forEach(key => {
                    if (!["name", "_className"].includes(key)) {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify(spec[key]) == JSON.stringify(libraryObject[key])) {
                            delete spec[key];
                        }
                    }
                })
            }
        }
        return spec;
    }

    change_Type(companion: AnimalCompanion, type: AnimalCompanionAncestry) {
        companion.class.ancestry = new AnimalCompanionAncestry();
        companion.class.ancestry = Object.assign(new AnimalCompanionAncestry(), JSON.parse(JSON.stringify(type))).recast();
    }

    add_Specialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization, levelNumber: number) {
        let newLength = companion.class.specializations.push(Object.assign(new AnimalCompanionSpecialization(), JSON.parse(JSON.stringify(spec))).recast());
        companion.class.specializations[newLength - 1].level = levelNumber;
    }

    remove_Specialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization) {
        companion.class.specializations = companion.class.specializations.filter(specialization => specialization.name != spec.name);
    }

    still_loading() {
        return (this.loading_ancestries || this.loading_levels || this.loading_specializations);
    }

    initialize() {
        //Initialize only once, but cleanup active effects everytime thereafter.
        if (!this.companionAncestries.length) {
            this.loading_ancestries = true;
            this.load(json_ancestries, "companionAncestries", AnimalCompanionAncestry);
            this.loading_ancestries = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.companionAncestries.forEach(ancestry => {
                ancestry.hints?.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
        if (!this.companionLevels.length) {
            this.loading_levels = true;
            this.load(json_levels, "companionLevels", AnimalCompanionLevel);
            //Sort levels by level number, after it may have got out of order with duplicates.
            this.companionLevels = this.companionLevels.sort((a, b) => a.number - b.number);
            this.loading_levels = false;
        }
        if (!this.companionSpecializations.length) {
            this.loading_specializations = true;
            this.load(json_specializations, "companionSpecializations", AnimalCompanionSpecialization);
            this.loading_specializations = false;
        } else {
            //Disable any active hint effects when loading a character.
            this.companionSpecializations.forEach(spec => {
                spec.hints?.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
    }

    load(source, target: string, type) {
        this[target] = [];
        let data = this.extensionsService.extend(source, target);
        Object.keys(data).forEach(key => {
            this[target].push(...data[key].map(obj => Object.assign(new type(), obj).recast()));
        });
        this[target] = this.extensionsService.cleanup_Duplicates(this[target], "name", target);
    }

}
