import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import * as json_abilities from 'src/assets/json/abilities';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';

@Injectable({
    providedIn: 'root',
})
export class AbilitiesDataService {
    private _abilities: Array<Ability> = [];
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public abilities(name = ''): Array<Ability> {
        if (!this.stillLoading) {
            return this._abilities.filter(ability => !name || ability.name === name);
        } else {
            return [new Ability()];
        }
    }

    public initialize(): void {
        //Initialize only once.
        if (!this._abilities.length) {
            this._abilities = this._loadAbilities();
            this._initialized = true;
        }
    }

    private _loadAbilities(): Array<Ability> {
        let abilities: Array<Ability> = [];

        const extendedData = this._extensionsService.extend(json_abilities, 'abilities');

        Object.keys(extendedData).forEach(key => {
            abilities.push(...extendedData[key].map((obj: Ability) => Object.assign(new Ability(), obj)));
        });
        abilities = this._extensionsService.cleanupDuplicates(abilities, 'name', 'abilities') as Array<Ability>;

        return abilities;
    }
}
