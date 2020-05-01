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

    get_Skills(customSkills: Skill[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let skills: Skill[] = this.skills.concat(customSkills);
            if (name == "Lore") {
                return skills.filter(skill => (skill.name.indexOf(name) > -1) && (skill.type == type || type == ""));
            }
            return skills.filter(skill => (skill.name == name || name == "") && (skill.type == type || type == ""));
        } else { return [new Skill()] }
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
            this.skills = this.loader.map(skill => Object.assign(new Skill(), skill));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }
}