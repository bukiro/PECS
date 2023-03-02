import { Injectable } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import * as json_abilities from 'src/assets/json/familiarabilities';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Types/jsonImportedItemFileList';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class FamiliarsDataService {

    private _familiarAbilities: Array<Feat> = [];
    private _initialized = false;

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public familiarAbilities(name?: string): Array<Feat> {
        if (!this.stillLoading) {
            return this._familiarAbilities.filter(ability => !name || ability.name.toLowerCase() === name.toLowerCase());
        } else { return [new Feat()]; }
    }

    public familiarAbilityFromName(name: string): Feat {
        return this._familiarAbilities.find(ability => ability.name.toLowerCase() === name.toLowerCase()) ||
            this._replacementAbility(name);
    }

    public initialize(): void {
        this._familiarAbilities = this._dataLoadingService.loadRecastable(
            json_abilities as ImportedJsonFileList<Feat>,
            'familiarAbilities',
            'name',
            Feat,
        );

        this._initialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._familiarAbilities.forEach(ability => {
            ability.hints?.forEach(hint => hint.deactivateAll());
        });
    }

    private _replacementAbility(name?: string): Feat {
        return Object.assign(
            new Feat(),
            {
                name: 'Familiar ability not found',
                desc: `${ name ? name : 'The requested familiar ability' } does not exist in the feat and features lists.`,
            },
        );
    }

}
