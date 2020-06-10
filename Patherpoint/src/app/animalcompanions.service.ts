import { Injectable } from '@angular/core';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { SavegameService } from './savegame.service';

@Injectable({
    providedIn: 'root'
})
export class AnimalCompanionsService {

    private companionAncestries: AnimalCompanionAncestry[];
    private companionLevels: AnimalCompanionLevel[];
    private companionSpecializations: AnimalCompanionSpecialization[];
    private loader_ancestries;
    private loader_levels;
    private loader_specializations;
    private loading_ancestries: boolean = false;
    private loading_levels: boolean = false;
    private loading_specializations: boolean = false;
    
    constructor(
        private http: HttpClient,
        private savegameService: SavegameService
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

    restore_AncestryFromSave(ancestry: AnimalCompanionAncestry, savegameService: SavegameService) {
        if (ancestry.name) {
            let libraryObject = this.get_CompanionTypes(ancestry.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    ancestry = savegameService.merge(libraryObject, ancestry);
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
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(ancestry[key]) == JSON.stringify(libraryObject[key])) {
                            delete ancestry[key];
                        }
                    }
                })
            }
        }
        return ancestry;
    }

    restore_LevelsFromSave($class: AnimalCompanionClass, savegameService: SavegameService) {
        if ($class.levels) {
            let libraryObject = this.get_CompanionLevels();
            if (libraryObject) {
                for (let index = 0; index < $class.levels.length; index++) {
                    //Map the restored object onto the library object and keep the result.
                try {
                    $class.levels = savegameService.merge(libraryObject, $class.levels);
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
                            //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
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

    restore_SpecializationFromSave(spec: AnimalCompanionSpecialization, savegameService: SavegameService) {
        if (spec.name) {
            let libraryObject = this.get_CompanionSpecializations(spec.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    spec = savegameService.merge(libraryObject, spec);
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
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(spec[key]) == JSON.stringify(libraryObject[key])) {
                            delete spec[key];
                        }
                    }
                })
            }
        }
        return spec;
    }

    still_loading() {
        return (this.loading_ancestries || this.loading_levels);
    }
  
    load_AnimalCompanions(): Observable<string[]>{
        return this.http.get<string[]>('/assets/animalcompanions.json');
    }

    load_AnimalCompanionLevels(): Observable<string[]>{
        return this.http.get<string[]>('/assets/animalcompanionlevels.json');
    }

    load_AnimalCompanionSpecializations(): Observable<string[]>{
        return this.http.get<string[]>('/assets/animalcompanionspecializations.json');
    }
  
    change_Type(companion: AnimalCompanion, type: AnimalCompanionAncestry) {
        companion.class.ancestry = new AnimalCompanionAncestry();
        companion.class.ancestry = Object.assign(new AnimalCompanionAncestry(), JSON.parse(JSON.stringify(type)));
        companion.class.ancestry = this.savegameService.reassign(companion.class.ancestry)
    }

    add_Specialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization, levelNumber: number) {
        let newLength = companion.class.specializations.push(Object.assign(new AnimalCompanionSpecialization(), JSON.parse(JSON.stringify(spec))));
        companion.class.specializations[newLength-1].level = levelNumber;
        companion.class.specializations[newLength-1] = this.savegameService.reassign(companion.class.specializations[newLength-1]);
    }

    remove_Specialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization) {
        companion.class.specializations = companion.class.specializations.filter(specialization => specialization.name != spec.name);
    }

    initialize() {
        if (!this.companionAncestries) {
            this.loading_ancestries = true;
            this.load_AnimalCompanions()
                .subscribe((results:string[]) => {
                    this.loader_ancestries = results;
                    this.finish_loading_Ancestries()
                });
        }
        if (!this.companionLevels) {
            this.loading_levels = true;
            this.load_AnimalCompanionLevels()
                .subscribe((results:string[]) => {
                    this.loader_levels = results;
                    this.finish_loading_Levels()
                });
        }
        if (!this.companionSpecializations) {
            this.loading_specializations = true;
            this.load_AnimalCompanionSpecializations()
                .subscribe((results:string[]) => {
                    this.loader_specializations = results;
                    this.finish_loading_Specializations()
                });
        }
    }
  
    finish_loading_Ancestries() {
        if (this.loader_ancestries) {
            this.companionAncestries = this.loader_ancestries.map(ancestry => Object.assign(new AnimalCompanionAncestry(), ancestry));
            
            this.companionAncestries.forEach(ancestry => {
                ancestry = this.savegameService.reassign(ancestry);
            });

            this.loader_ancestries = [];
        }
        if (this.loading_ancestries) {this.loading_ancestries = false;}
    }

    finish_loading_Levels() {
        if (this.loader_levels) {
            this.companionLevels = this.loader_levels.map(level => Object.assign(new AnimalCompanionLevel(), level));
            
            this.companionLevels.forEach(level => {
                level = this.savegameService.reassign(level);
            });

            this.loader_levels = [];
        }
        if (this.loading_levels) {this.loading_levels = false;}
    }

    finish_loading_Specializations() {
        if (this.loader_specializations) {
            this.companionSpecializations = this.loader_specializations.map(specialization => Object.assign(new AnimalCompanionSpecialization(), specialization));
            
            this.companionSpecializations.forEach(specialization => {
                specialization = this.savegameService.reassign(specialization);
            });

            this.loader_specializations = [];
        }
        if (this.loading_specializations) {this.loading_specializations = false;}
    }

}
