import { Injectable } from '@angular/core';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import * as json_ancestries from 'src/assets/json/animalcompanions';
import * as json_levels from 'src/assets/json/animalcompanionlevels';
import * as json_specializations from 'src/assets/json/animalcompanionspecializations';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Interfaces/jsonImportedItemFileList';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionsDataService {

    private _companionAncestries: Array<AnimalCompanionAncestry> = [];
    private _companionLevels: Array<AnimalCompanionLevel> = [];
    private _companionSpecializations: Array<AnimalCompanionSpecialization> = [];
    private _ancestriesInitialized = false;
    private _levelsInitialized = false;
    private _specializationsInitialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _recastService: RecastService,
    ) { }

    public get stillLoading(): boolean {
        return !(this._ancestriesInitialized && this._levelsInitialized && this._specializationsInitialized);
    }

    public companionTypes(name = ''): Array<AnimalCompanionAncestry> {
        if (!this.stillLoading) {
            return this._companionAncestries.filter(animalCompanion => !name || animalCompanion.name === name);
        } else { return [new AnimalCompanionAncestry()]; }
    }

    public companionLevels(): Array<AnimalCompanionLevel> {
        if (!this.stillLoading) {
            return this._companionLevels;
        } else { return [new AnimalCompanionLevel()]; }
    }

    public companionSpecializations(name = ''): Array<AnimalCompanionSpecialization> {
        if (!this.stillLoading) {
            return this._companionSpecializations.filter(spec => !name || spec.name === name);
        } else { return [new AnimalCompanionSpecialization()]; }
    }

    public initialize(): void {
        const animalCompanionAncestry = new AnimalCompanionAncestry();

        this._companionAncestries =
            this._load(json_ancestries, 'companionAncestries', animalCompanionAncestry);
        this._ancestriesInitialized = true;

        const animalCompanionLevel = new AnimalCompanionLevel();

        this._companionLevels = this._load(json_levels, 'companionLevels', animalCompanionLevel);
        //Sort levels by level number, after it may have got out of order with duplicates.
        this._companionLevels.sort((a, b) => a.number - b.number);
        this._levelsInitialized = true;

        const animalCompanionSpecialization = new AnimalCompanionSpecialization();

        this._companionSpecializations =
            this._load(json_specializations, 'companionSpecializations', animalCompanionSpecialization);
        this._specializationsInitialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._companionAncestries.forEach(ancestry => {
            ancestry.hints?.forEach(hint => hint.deactivateAll());
        });
        //Disable any active hint effects when loading a character.
        this._companionSpecializations.forEach(spec => {
            spec.hints?.forEach(hint => hint.deactivateAll());
        });
    }

    private _load<T extends AnimalCompanionAncestry | AnimalCompanionLevel | AnimalCompanionSpecialization>(
        data: ImportedJsonFileList<T>,
        target: string,
        prototype: T,
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(new (prototype.constructor as (new () => T))(), entry).recast(this._recastService.restoreFns) as T,
            ));
        });

        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'name', target);

        return resultingData;
    }

}
