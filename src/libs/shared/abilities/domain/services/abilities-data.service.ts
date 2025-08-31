import { inject, Injectable } from '@angular/core';
import * as json_abilities from 'src/assets/json/abilities';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { Ability } from '../../util/models/ability';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';

@Injectable({
    providedIn: 'root',
})
export class AbilitiesDataService {
    private _abilities: Array<Ability> = [];
    private _initialized = false;
    private readonly _abilitiesMap = new Map<string, Ability>();

    private readonly _dataLoadingService = inject(DataLoadingService);
    private readonly _recastService = inject(RecastService);

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
            return [];
        }
    }

    public initialize(): void {
        this._abilities = this._dataLoadingService.loadSerializable(json_abilities, 'abilities', 'name', Ability);
        this._abilities.forEach(ability => {
            this._abilitiesMap.set(ability.name.toLowerCase(), ability);
        });

        this._registerRecastFns();

        this._initialized = true;
    }

    private _replacementAbility(name?: string): Ability {
        return Ability.from({
            name: `${ name ? name : 'Ability' } not found`,
        });
    }

    private _registerRecastFns(): void {
        const abilityLookupFn =
            (name: string): Ability =>
                this.abilityFromName(name);

        this._recastService.registerAbilityLookupFns(abilityLookupFn);
    }
}
