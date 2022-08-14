import { Injectable } from '@angular/core';
import { Trait } from 'src/app/classes/Trait';
import { Creature } from 'src/app/classes/Creature';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';

@Injectable({
    providedIn: 'root',
})
export class HintShowingObjectsService {

    constructor(
        private readonly _traitsDataService: TraitsDataService,
    ) { }

    public traitsShowingHintsOnThis(creature: Creature, name: string): Array<Trait> {
        if (!this._traitsDataService.stillLoading) {
            // Return all traits that are set to SHOW ON this named object and that are on any equipped equipment in your inventory.
            // Uses the itemsWithThisTrait() method of Trait that returns any equipment that has this trait.
            return this._traitsDataService.traits().filter(trait =>
                trait.hints.some(hint =>
                    hint.showon.split(',').some(showon =>
                        showon.trim().toLowerCase() === name.toLowerCase() ||
                        showon.trim().toLowerCase() === (`${ creature.type }:${ name }`).toLowerCase() ||
                        (
                            name.toLowerCase().includes('lore') &&
                            showon.trim().toLowerCase() === 'lore'
                        ),
                    ),
                )
                && !!trait.itemsWithThisTrait(creature).length,
            );
        } else {
            return [];
        }
    }

}
