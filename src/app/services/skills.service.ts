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
    private loading = true;

    constructor(
        private extensionsService: ExtensionsService
    ) { }

    private get_TempSkill(name = '', filter: { type?: string }): Skill {
        filter = Object.assign({
            ability: '',
            type: '',
            locked: undefined,
            recallKnowledge: undefined
        });
        const skill = this.tempSkills.find(skill =>
            (
                skill.name.toLowerCase().includes(name.toLowerCase())
            ) && (
                filter.type ? skill.type.toLowerCase() == filter.type.toLowerCase() : true
            )
        );
        if (skill) {
            return skill;
        } else {
            const newLength = this.tempSkills.push(new Skill('', name, filter.type, false, false));
            return this.tempSkills[newLength - 1];
        }
    }

    public get_Skills(customSkills: Skill[], name = '', filter: { type?: string, locked?: boolean } = {}, options: { noSubstitutions?: boolean } = {}): Skill[] {
        //Gets all skills, including a provided custom skill list, filtered by name, type and locked.
        //Some exotic skills don't exist until queried. If a named skill is not found, a temporary skill is created for the rest of the session.
        //If you want to check if a skill exists, use noSubstitutions to prevent returning a temporary skill.
        filter = Object.assign({
            type: '',
            locked: undefined,
            noSubstitution: false
        }, filter);
        if (!this.still_loading()) {
            if (name == 'Lore') {
                return this.skills.concat(customSkills).filter(skill =>
                    (
                        skill.name.toLowerCase().includes(name.toLowerCase())
                    ) && (
                        filter.type ? skill.type.toLowerCase() == filter.type.toLowerCase() : true
                    ) && (
                        filter.locked != undefined ? skill.locked == filter.locked : true
                    )
                );
            }
            const skills = this.skills.concat(customSkills).filter(skill =>
                (
                    name ? skill.name.toLowerCase() == name.toLowerCase() : true
                ) && (
                    filter.type ? skill.type.toLowerCase() == filter.type.toLowerCase() : true
                ) && (
                    filter.locked != undefined ? skill.locked == filter.locked : true
                ));
            if (skills.length) {
                return skills;
            } else if (name && !options.noSubstitutions) {
                return [this.get_TempSkill(name, { type: filter.type })];
            } else {
                return [];
            }
        } else { return [new Skill()]; }
    }

    get_SkillLevelName(level: number, short = false) {
        if (short) {
            return ['U', 'U', 'T', 'T', 'E', 'E', 'M', 'M', 'L'][level];
        } else {
            return ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'][level];
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
        const data = this.extensionsService.extend(json_skills, 'skills');
        Object.keys(data).forEach(key => {
            this.skills.push(...data[key].map((obj: Skill) => Object.assign(new Skill(), obj).recast()));
        });
        this.skills = this.extensionsService.cleanup_Duplicates(this.skills, 'name', 'skills') as Skill[];
    }

}
