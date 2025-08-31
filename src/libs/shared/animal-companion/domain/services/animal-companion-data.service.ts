import { inject, Injectable, signal, Signal } from '@angular/core';
import * as json_ancestries from 'src/assets/json/animalcompanions';
import * as json_stages from 'src/assets/json/animalcompanionlevels';
import * as json_specializations from 'src/assets/json/animalcompanionspecializations';
import { AnimalCompanionAncestry } from 'src/libs/shared/animal-companion/util/models/animal-companion-ancestry';
import { AnimalCompanionStage } from 'src/libs/shared/animal-companion/util/models/animal-companion-stage';
import { AnimalCompanionSpecialization } from 'src/libs/shared/feats/util/models/animal-companion-specialization';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionDataService {

    private _companionAncestries: Array<AnimalCompanionAncestry> = [];
    private _companionStages: Array<AnimalCompanionStage> = [];
    private _companionSpecializations: Array<AnimalCompanionSpecialization> = [];
    private _ancestriesInitialized = false;
    private _stagesInitialized = false;
    private _specializationsInitialized = false;

    private readonly _dataLoadingService = inject(DataLoadingService);
    private readonly _recastService = inject(RecastService);

    public get stillLoading(): boolean {
        return !(this._ancestriesInitialized && this._stagesInitialized && this._specializationsInitialized);
    }

    public companionTypes(name = ''): Array<AnimalCompanionAncestry> {
        if (!this.stillLoading) {
            return this._companionAncestries.filter(animalCompanion => !name || animalCompanion.name === name);
        } else { return [new AnimalCompanionAncestry()]; }
    }

    public companionLevels(): Array<AnimalCompanionStage> {
        if (!this.stillLoading) {
            return this._companionStages;
        } else { return [new AnimalCompanionStage()]; }
    }

    public companionSpecializations(name = ''): Array<AnimalCompanionSpecialization> {
        if (!this.stillLoading) {
            return this._companionSpecializations.filter(spec => !name || spec.name === name);
        } else { return [new AnimalCompanionSpecialization()]; }
    }

    public initialize(): void {
        this._companionAncestries =
            this._dataLoadingService.loadSerializable(
                json_ancestries as ImportedJsonFileList<AnimalCompanionAncestry>,
                'companionAncestries',
                'name',
                AnimalCompanionAncestry,
            );
        this._ancestriesInitialized = true;

        this._companionStages =
            this._dataLoadingService.loadSerializable(
                json_stages as ImportedJsonFileList<AnimalCompanionStage>,
                'companionLevels',
                'name',
                AnimalCompanionStage,
            );
        this._registerRecastFns();
        this._stagesInitialized = true;

        this._companionSpecializations =
            this._dataLoadingService.loadSerializable(
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

    private _registerRecastFns(): void {
        const stagesLookupFn =
            (): Signal<Array<AnimalCompanionStage>> =>
                signal(this._companionStages).asReadonly();

        this._recastService.registerAnimalCompanionStagesFns(stagesLookupFn);
    }

}
