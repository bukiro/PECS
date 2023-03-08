import { Injectable } from '@angular/core';
import { Skill } from 'src/app/classes/Skill';
import * as json_skills from 'src/assets/json/skills';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class SkillsDataService {
    private _skills: Array<Skill> = [];
    private readonly _tempSkills: Array<Skill> = [];
    private _initialized = false;

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public skills(
        customSkills: Array<Skill>,
        name = '',
        filter: { type?: string; locked?: boolean } = {},
        options: { noSubstitutions?: boolean } = {},
    ): Array<Skill> {
        // Gets all skills, including a provided custom skill list, filtered by name, type and locked.
        // Some exotic skills don't exist until queried.
        // If a named skill is not found, a temporary skill is created for the rest of the session.
        // If you want to check if a skill exists, use noSubstitutions to prevent returning a temporary skill.
        filter = {
            type: '',
            locked: undefined,
            ...filter,
        };
        options = {
            noSubstitutions: false,
            ...options,
        };

        if (!this.stillLoading) {
            if (name === 'Lore') {
                return this._skills.concat(customSkills).filter(skill =>
                    (
                        skill.name.toLowerCase().includes(name.toLowerCase())
                    ) && (
                        filter.type ? skill.type.toLowerCase() === filter.type.toLowerCase() : true
                    ) && (
                        filter.locked !== undefined ? skill.locked === filter.locked : true
                    ),
                );
            }

            const skills = this._skills.concat(customSkills).filter(skill =>
                (
                    name ? skill.name.toLowerCase() === name.toLowerCase() : true
                ) && (
                    filter.type ? skill.type.toLowerCase() === filter.type.toLowerCase() : true
                ) && (
                    filter.locked !== undefined ? skill.locked === filter.locked : true
                ));

            if (skills.length) {
                return skills;
            } else if (name && !options.noSubstitutions) {
                return [this._tempSkill(name, { type: filter.type })];
            } else {
                return [];
            }
        } else { return [new Skill()]; }
    }

    public skillFromName(name: string, customSkills: Array<Skill> = []): Skill {
        return this.skills(customSkills, name)[0];
    }

    public initialize(): void {
        this._skills = this._dataLoadingService.loadRecastable(
            json_skills,
            'skills',
            'name',
            Skill,
        );

        this._initialized = true;
    }

    public reset(): void {
        this._tempSkills.length = 0;
    }

    private _tempSkill(name = '', filter: { type?: string }): Skill {
        filter = {
            type: '',
            ...filter,
        };

        const skill = this._tempSkills.find(tempSkill =>
            (
                tempSkill.name.toLowerCase().includes(name.toLowerCase())
            ) && (
                filter.type ? tempSkill.type.toLowerCase() === filter.type.toLowerCase() : true
            ),
        );

        if (skill) {
            return skill;
        } else {
            const newLength = this._tempSkills.push(new Skill('', name, filter.type, false, false));

            return this._tempSkills[newLength - 1];
        }
    }

}
