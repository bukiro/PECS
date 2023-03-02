import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import * as json_abilities from 'src/assets/json/abilities';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class AbilitiesDataService {
    private _abilities: Array<Ability> = [];
    private _initialized = false;
    private readonly _abilitiesMap = new Map<string, Ability>();

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public abilityFromName(name: string): Ability {
        //Returns a named activity from the map.
        return this._abilitiesMap.get(name.toLowerCase()) || this._replacementAbility(name);
    }

    public abilities(name = ''): Array<Ability> {
        if (!this.stillLoading) {
            return this._abilities.filter(ability => !name || ability.name === name);
        } else {
            return [new Ability()];
        }
    }

    public initialize(): void {
        this._abilities = this._dataLoadingService.loadNonRecastable(json_abilities, 'abilities', 'name', Ability);
        this._abilities.forEach(ability => {
            this._abilitiesMap.set(ability.name.toLowerCase(), ability);
        });
        this._initialized = true;
    }

    private _replacementAbility(name?: string): Ability {
        return Object.assign(
            new Ability(),
            {
                name: `${ name ? name : 'Ability' } not found`,
            },
        );
    }
}
