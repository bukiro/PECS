import { Injectable } from '@angular/core';
import { FeatTakingService } from 'src/app/character-creation/services/feat-taking/feat-taking.service';
import { CreatureService } from 'src/app/services/character.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class FamiliarService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _featTakingService: FeatTakingService,
    ) { }

    public initializeFamiliar(): void {
        const character = CreatureService.character;

        if (character.class.familiar) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'all');
        }
    }

    public removeAllFamiliarAbilities(): void {
        const familiar = CreatureService.familiar;
        const abilityNames = familiar.abilities.feats.map(gain => gain.name);

        abilityNames.forEach(abilityName => {
            this._featTakingService.takeFeat(familiar, undefined, abilityName, false, familiar.abilities);
        });
    }

}
