import { Injectable } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import * as json_spells from 'src/assets/json/spells';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class SpellsDataService {

    private _spells: Array<Spell> = [];
    private _initialized = false;
    private readonly _spellsMap = new Map<string, Spell>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _recastService: RecastService,
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
        this._loadSpells();
        this._spellsMap.clear();
        this._spells.forEach(spell => {
            this._spellsMap.set(spell.name.toLowerCase(), spell);
        });
        this._initialized = true;
    }

    private _loadSpells(): void {
        this._spells = [];

        const data = this._extensionsService.extend(json_spells, 'spells');

        Object.keys(data).forEach(key => {
            this._spells.push(...data[key].map(obj => Object.assign(new Spell(), obj).recast(this._recastService.restoreFns)));
        });
        this._spells = this._extensionsService.cleanupDuplicates(this._spells, 'id', 'spells');
    }

    private _replacementSpell(name?: string): Spell {
        return Object.assign(
            new Spell(),
            { name: 'Spell not found', desc: `${ name ? name : 'The requested spell' } does not exist in the spells list.` },
        );
    }

}
