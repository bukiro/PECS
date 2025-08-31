import { inject, Injectable } from '@angular/core';
import * as json_spells from 'src/assets/json/spells';
import { DataLoadingService } from 'src/libs/shared/content-data/domain/services/data-loading.service';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { Spell } from '../../util/models/spell';
import { SpellTraditions } from '../../util/models/spell-traditions';

@Injectable({
    providedIn: 'root',
})
export class SpellsDataService {

    private _spells: Array<Spell> = [];
    private _initialized = false;
    private readonly _spellsMap = new Map<string, Spell>();

    private readonly _dataLoadingService = inject(DataLoadingService);
    private readonly _recastService = inject(RecastService);

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

        this._registerRecastFns();

        this._initialized = true;
    }

    private _replacementSpell(name?: string): Spell {
        return Spell.from(
            { name: 'Spell not found', desc: `${ name ? name : 'The requested spell' } does not exist in the spells list.` },
            RecastService.recastFns,
        );
    }

    private _registerRecastFns(): void {
        const spellLookupFn =
            (name: string): Spell =>
                this.spellFromName(name);

        this._recastService.registerSpellLookupFns(spellLookupFn);
    }

}
