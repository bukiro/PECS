import { Injectable } from '@angular/core';
import { Skill } from './Skill';
import * as json_skills from '../assets/json/skills';

@Injectable({
    providedIn: 'root'
})
export class SkillsService {
    private skills: Skill[] = []; 
    private loading: boolean = true;
    
    constructor() { }

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

    get_SkillLevelName(level: number, short: boolean = false) {
        if (short) {
            return ["U", "U", "T", "T", "E", "E", "M", "M", "L"][level]
        } else {
            return ["Untrained", "Untrained", "Trained", "Trained", "Expert", "Expert", "Master", "Master", "Legendary"][level]
        }
    }

    still_loading() {
        return (this.loading);
    }

    initialize() {
        if (!this.skills.length) {
            this.loading = true;
            this.load_Skills();
            this.loading = false;
        }
    }

    load_Skills() {
        this.skills = [];
        Object.keys(json_skills).forEach(key => {
            this.skills.push(...json_skills[key].map(obj => Object.assign(new Skill(), obj)));
        });
    }
    
}