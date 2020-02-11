import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Skill } from './Skill';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';

@Injectable({
    providedIn: 'root'
})
export class SkillsService {
    private skills: Skill[]; 
    private loader; 
    private loading: Boolean = false;
    
    constructor(
        private http: HttpClient,
        private characterService: CharacterService,
    ) { }
    
    get_Skills(key:string = "", value = undefined, key2:string = "", value2 = undefined, key3:string = "", value3 = undefined) {
        if (!this.still_loading()) {
            let skills = this.skills.concat(this.characterService.get_Character().lore)
            if (key == "" || value == undefined) {
                return skills;
            } else {
                skills = skills.filter(
                    item => item[key] == value
                    );
                if (key2 == "" || value2 == undefined) {
                    return skills;
                } else {
                    skills = skills.filter(
                        item => item[key2] == value2
                        );
                    if (key3 == "" || value3 == undefined) {
                        return skills;
                    } else {
                        skills = skills.filter(
                            item => item[key] == value3
                            );
                        return skills;
                    }
                }
            }
        }
    }

    still_loading() {
        return (this.loading);
    }

    load_Skills(): Observable<String[]>{
        return this.http.get<String[]>('/assets/skills.json');
    }

    initialize() {
        if (!this.skills) {
        this.loading = true;
        this.load_Skills()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.skills = [];

            this.loader.forEach(element => {
                this.skills.push(new Skill(element.name, element.ability)
                )});
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }
}