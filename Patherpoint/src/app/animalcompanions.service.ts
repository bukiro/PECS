import { Injectable } from '@angular/core';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';

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
    ) { }

    get_CompanionTypes(name: string = "") {
        if (!this.still_loading()) {
            return this.companionAncestries.filter(animalCompanion => animalCompanion.name == name || name == "")
        } else { return [new AnimalCompanionAncestry()] }
    }

    get_CompanionLevels() {
        if (!this.still_loading()) {
            return this.companionLevels;
        } else { return [new AnimalCompanionLevel()] }
    }

    get_CompanionSpecializations() {
        if (!this.still_loading()) {
            return this.companionSpecializations;
        } else { return [new AnimalCompanionSpecialization()] }
    }

    still_loading() {
        return (this.loading_ancestries || this.loading_levels);
    }
  
    load_AnimalCompanions(): Observable<String[]>{
        return this.http.get<String[]>('/assets/animalcompanions.json');
    }

    load_AnimalCompanionLevels(): Observable<String[]>{
        return this.http.get<String[]>('/assets/animalcompanionlevels.json');
    }

    load_AnimalCompanionSpecializations(): Observable<String[]>{
        return this.http.get<String[]>('/assets/animalcompanionspecializations.json');
    }
  
    change_Type(companion: AnimalCompanion, type: AnimalCompanionAncestry) {
        companion.class.ancestry = new AnimalCompanionAncestry();
        companion.class.ancestry = Object.assign(new AnimalCompanionAncestry(), JSON.parse(JSON.stringify(type)));
        companion.class.ancestry.reassign();
    }

    add_Specialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization, levelNumber: number) {
        let newLength = companion.class.specializations.push(Object.assign(new AnimalCompanionSpecialization(), JSON.parse(JSON.stringify(spec))));
        companion.class.specializations[newLength-1].level = levelNumber;
        companion.class.specializations[newLength-1].reassign();
    }

    remove_Specialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization) {
        companion.class.specializations = companion.class.specializations.filter(specialization => specialization.name != spec.name)
    }

    initialize() {
        if (!this.companionAncestries) {
            this.loading_ancestries = true;
            this.load_AnimalCompanions()
                .subscribe((results:String[]) => {
                    this.loader_ancestries = results;
                    this.finish_loading_Ancestries()
                });
        }
        if (!this.companionLevels) {
            this.loading_levels = true;
            this.load_AnimalCompanionLevels()
                .subscribe((results:String[]) => {
                    this.loader_levels = results;
                    this.finish_loading_Levels()
                });
        }
        if (!this.companionSpecializations) {
            this.loading_specializations = true;
            this.load_AnimalCompanionSpecializations()
                .subscribe((results:String[]) => {
                    this.loader_specializations = results;
                    this.finish_loading_Specializations()
                });
        }
    }
  
    finish_loading_Ancestries() {
        if (this.loader_ancestries) {
            this.companionAncestries = this.loader_ancestries.map(animalCompanion => Object.assign(new AnimalCompanionAncestry(), animalCompanion));
            
            this.loader_ancestries = [];
        }
        if (this.loading_ancestries) {this.loading_ancestries = false;}
    }

    finish_loading_Levels() {
        if (this.loader_levels) {
            this.companionLevels = this.loader_levels.map(animalCompanionLevel => Object.assign(new AnimalCompanionLevel(), animalCompanionLevel));
            
            this.loader_levels = [];
        }
        if (this.loading_levels) {this.loading_levels = false;}
    }

    finish_loading_Specializations() {
        if (this.loader_specializations) {
            this.companionSpecializations = this.loader_specializations.map(animalCompanionSpecialization => Object.assign(new AnimalCompanionSpecialization(), animalCompanionSpecialization));
            
            this.loader_specializations = [];
        }
        if (this.loading_specializations) {this.loading_specializations = false;}
    }

}
