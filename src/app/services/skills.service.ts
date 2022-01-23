import { Injectable } from '@angular/core';
import { Skill } from 'src/app/classes/Skill';
import * as json_skills from 'src/assets/json/skills';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Injectable({
    providedIn: 'root'
})
export class SkillsService {
    private skills: Skill[] = [];
    private tempSkills: Skill[] = [];
    private loading: boolean = true;

    constructor(
        private extensionsService: ExtensionsService
    ) { }

    get_TempSkill(name: string = "", filter: { ability?: string, type?: string, locked?: boolean, recallKnowledge?: boolean }): Skill {
        filter = Object.assign({
            ability: "",
            type: "",
            locked: undefined,
            recallKnowledge: undefined
        })
        const skill = this.tempSkills.find(skill =>
            (
                skill.name.toLowerCase().includes(name.toLowerCase())
            ) && (
                filter.ability ? skill.ability.toLowerCase() == filter.ability.toLowerCase() : true
            ) && (
                filter.type ? skill.type.toLowerCase() == filter.type.toLowerCase() : true
            ) && (
                filter.locked != undefined ? skill.locked == filter.locked : true
            ) && (
                filter.recallKnowledge != undefined ? skill.recallKnowledge == filter.recallKnowledge : true
            )
        )
        if (skill) {
            return skill;
        } else {
            const newLength = this.tempSkills.push(new Skill(filter.ability, name, filter.type, filter.locked, filter.recallKnowledge));
            return this.tempSkills[newLength - 1];
        }
    }

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
                    )
                );
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
        //Initialize only once, but clear temp skills at every load.
        if (!this.skills.length) {
            this.loading = true;
            this.load_Skills();
            this.loading = false;
        }
        this.tempSkills.length = 0;
    }

    load_Skills() {
        this.skills = [];
        let data = this.extensionsService.extend(json_skills, "skills");
        Object.keys(data).forEach(key => {
            this.skills.push(...data[key].map((obj: Skill) => Object.assign(new Skill(), obj).recast()));
        });
        this.skills = this.extensionsService.cleanup_Duplicates(this.skills, "name", "skills");
    }

}