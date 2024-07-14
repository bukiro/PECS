import { Injectable } from '@angular/core';
import { Spell } from 'src/app/classes/spells/spell';
import * as json_spells from 'src/assets/json/spells';
import { SpellTraditions } from '../../definitions/spell-traditions';
import { ImportedJsonFileList } from '../../definitions/types/json-imported-item-file-list';
import { RecastService } from '../recast/recast.service';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class SpellsDataService {

    private _spells: Array<Spell> = [];
    private _initialized = false;
    private readonly _spellsMap = new Map<string, Spell>();

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public spellFromName(name: string): Spell {
        //Returns a named spell from the map.
        return this._spellsMap.get(name.toLowerCase()) || this._replacementSpell(name);
    }

    public spells(name = '', type = '', tradition: (SpellTraditions | '') = ''): Array<Spell> {
        if (!this.stillLoading) {
            //If only a name is given, try to find a spell by that name in the index map. This should be much quicker.
            if (name && !type && !tradition) {
                return [this.spellFromName(name)];
            } else {
                return this._spells.filter(spell =>
                    (!name || spell.name.toLowerCase() === name.toLowerCase()) &&
                    (!type || spell.traits.includes(type)) &&
                    (!tradition || spell.traditions.includes(tradition)),
                );
            }
        }

        return [this._replacementSpell()];
    }

    public initialize(): void {
        this._spells = this._dataLoadingService.loadSerializable(
            json_spells as ImportedJsonFileList<Spell>,
            'spells',
            'id',
            Spell,
        );

        this._spellsMap.clear();
        this._spells.forEach(spell => {
            this._spellsMap.set(spell.name.toLowerCase(), spell);
        });
        this._initialized = true;
    }

    private _replacementSpell(name?: string): Spell {
        return Spell.from(
            { name: 'Spell not found', desc: `${ name ? name : 'The requested spell' } does not exist in the spells list.` },
            RecastService.recastFns,
        );
    }

}
