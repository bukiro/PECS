import { Injectable } from '@angular/core';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import * as json_ancestries from 'src/assets/json/animalcompanions';
import * as json_levels from 'src/assets/json/animalcompanionlevels';
import * as json_specializations from 'src/assets/json/animalcompanionspecializations';
import { DataLoadingService } from './data-loading.service';
import { ImportedJsonFileList } from '../../definitions/types/jsonImportedItemFileList';

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
        private readonly _dataLoadingService: DataLoadingService,
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
        this._companionAncestries =
            this._dataLoadingService.loadCastable(
                json_ancestries as ImportedJsonFileList<AnimalCompanionAncestry>,
                'companionAncestries',
                'name',
                AnimalCompanionAncestry,
            );
        this._ancestriesInitialized = true;

        this._companionLevels =
            this._dataLoadingService.loadCastable(
                json_levels,
                'companionLevels',
                'name',
                AnimalCompanionLevel,
            );
        //Sort levels by level number, after it may have got out of order with duplicates.
        this._companionLevels.sort((a, b) => a.number - b.number);
        this._levelsInitialized = true;

        this._companionSpecializations =
            this._dataLoadingService.loadCastable(
                json_specializations as ImportedJsonFileList<AnimalCompanionSpecialization>,
                'companionSpecializations',
                'name',
                AnimalCompanionSpecialization,
            );
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

}
