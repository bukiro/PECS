import { Injectable } from '@angular/core';
import { FeatTakingService } from 'src/app/character-creation/services/feat-taking/feat-taking.service';
import { Familiar } from 'src/app/classes/Familiar';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class FamiliarService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _refreshService: RefreshService,
        private readonly _featTakingService: FeatTakingService,
    ) { }

    public initializeFamiliar(): void {
        const character = this._characterService.character;

        if (character.class.familiar) {
            character.class.familiar = Object.assign(new Familiar(), character.class.familiar).recast(this._itemsDataService);
            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'all');
        }
    }

    public removeAllFamiliarAbilities(): void {
        const familiar = this._characterService.familiar;
        const abilityNames = familiar.abilities.feats.map(gain => gain.name);

        abilityNames.forEach(abilityName => {
            this._featTakingService.takeFeat(familiar, undefined, abilityName, false, familiar.abilities, undefined);
        });
    }

}
