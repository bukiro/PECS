import { inject, Injectable } from '@angular/core';
import * as json_skills from 'src/assets/json/skills';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { matchBooleanFilter, matchStringFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { Skill } from '../../util/models/skill';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';

@Injectable({
    providedIn: 'root',
})
export class SkillsDataService {
    private readonly _dataLoadingService = inject(DataLoadingService);
    private readonly _recastService = inject(RecastService);

    private _skills: Array<Skill> = [];
    private readonly _tempSkills: Array<Skill> = [];
    private _initialized = false;

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
        if (this.stillLoading) {
            return [];
        }

        // For the "Lore" skill, return all skills with "Lore" in their name that match the filter.
        if (stringEqualsCaseInsensitive(name, 'Lore')) {
            return this._loreSkills(customSkills, filter);
        }

        const skills = this._skills.concat(customSkills).filter(skill =>
            matchStringFilter({ value: skill.name, match: name })
            && matchStringFilter({ value: skill.type, match: filter.type })
            && matchBooleanFilter({ value: skill.locked, match: filter.locked }),
        );

        if (skills.length) {
            return skills;
        }

        if (name && !options.noSubstitutions) {
            return [this._tempSkill(name, { type: filter.type })];
        }

        return [];
    }

    public skillFromName(name: string, customSkills: Array<Skill> = []): Skill {
        return this.skills(customSkills, name)[0] ?? this._tempSkill(name, { type: '' });
    }

    public initialize(): void {
        this._skills = this._dataLoadingService.loadSerializable(
            json_skills,
            'skills',
            'name',
            Skill,
        );

        this._registerRecastFns();

        this._initialized = true;
    }

    public reset(): void {
        this._tempSkills.length = 0;
    }

    /** To collect lore skills, return all skills with Lore in the name that match the filter. */
    private _loreSkills(
        customSkills: Array<Skill>,
        filter: { type?: string; locked?: boolean } = {},
    ): Array<Skill> {
        return this._skills
            .concat(customSkills)
            .filter(skill =>
                stringEqualsCaseInsensitive(skill.name, 'Lore', { allowPartialString: true })
                && matchStringFilter({ value: skill.type, match: filter.type })
                && matchBooleanFilter({ value: skill.locked, match: filter.locked }),
            );
    }

    private _tempSkill(name = '', filter: { type?: string }): Skill {
        filter = {
            type: '',
            ...filter,
        };

        const skill = this._tempSkills.find(tempSkill =>
            stringEqualsCaseInsensitive(tempSkill.name, name, { allowPartialString: true })
            && matchStringFilter({ value: tempSkill.type, match: filter.type }),
        );

        if (skill) {
            return skill;
        } else {
            const addedSkill = new Skill('', name, filter.type, false, false);

            this._tempSkills.push(addedSkill);

            return addedSkill;
        }
    }

    private _registerRecastFns(): void {
        const skillLookupFn =
            (name: string, customSkills?: Array<Skill>): Skill =>
                this.skillFromName(name, customSkills);

        this._recastService.registerSkillLookupFns(skillLookupFn);
    }

}
