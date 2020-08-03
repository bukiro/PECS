import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Skill } from './Skill';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SkillsService {
    private skills: Skill[]; 
    private loader; 
    private loading: boolean = true;
    
    constructor(
        private http: HttpClient,
    ) { }

    get_Skills(customSkills: Skill[], name: string = "", type: string = "", locked: boolean = undefined) {
        if (!this.still_loading()) {
            let skills: Skill[] = this.skills.concat(customSkills);
            if (name == "Lore") {
                return skills.filter(skill => 
                (
                    skill.name.toLowerCase().includes(name.toLowerCase())
                ) && (
                    type ? skill.type.toLowerCase() == type.toLowerCase() : true
                ) && (
                    locked != undefined ? skill.locked == locked : true
                ));
            }
            return skills.filter(skill => 
                (
                    name ? skill.name.toLowerCase() == name.toLowerCase() : true
                ) && (
                    type ? skill.type.toLowerCase() == type.toLowerCase() : true
                ) && (
                    locked != undefined ? skill.locked == locked : true
                ));
        } else { return [new Skill()] }
    }    

    still_loading() {
        return (this.loading);
    }

    load_Skills(): Observable<string[]>{
        return this.http.get<string[]>('/assets/skills.json');
    }

    initialize() {
        if (!this.skills) {
        this.loading = true;
        this.load_Skills()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.skills = this.loader.map(skill => Object.assign(new Skill(), skill));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }
}