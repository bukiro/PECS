import { Injectable } from '@angular/core';
import { Ability } from 'src/app/classes/Ability';
import * as json_abilities from 'src/assets/json/abilities';
import { ExtensionsService } from 'src/app/services/extensions.service';

@Injectable({
    providedIn: 'root',
})
export class AbilitiesDataService {
    private _abilities: Array<Ability> = [];
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public abilities(name = ''): Array<Ability> {
        if (!this.stillLoading()) {
            return this._abilities.filter(ability => !name || ability.name === name);
        } else {
            return [new Ability()];
        }
    }

    public stillLoading(): boolean {
        return (!this._initialized);
    }

    public initialize(): void {
        //Initialize only once.
        if (!this._abilities.length) {
            this._loadAbilities();
            this._initialized = true;
        }
    }

    private _loadAbilities(): void {
        this._abilities = [];

        const data = this._extensionsService.extend(json_abilities, 'abilities');

        Object.keys(data).forEach(key => {
            this._abilities.push(...data[key].map((obj: Ability) => Object.assign(new Ability(), obj)));
        });
        this._abilities = this._extensionsService.cleanup_Duplicates(this._abilities, 'name', 'abilities') as Array<Ability>;
    }
}
