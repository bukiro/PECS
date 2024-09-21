import { Injectable } from '@angular/core';
import { FeatTakingService } from 'src/libs/character-creation/services/feat-taking/feat-taking.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { take } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FamiliarService {

    constructor(
        private readonly _featTakingService: FeatTakingService,
    ) { }

    public removeAllFamiliarAbilities(): void {
        CreatureService.familiar$
            .pipe(
                take(1),
            )
            .subscribe(familiar => {
                const abilityNames = familiar.abilities.feats.map(gain => gain.name);

                abilityNames.forEach(abilityName => {
                    this._featTakingService.takeFeat(familiar, undefined, abilityName, false, familiar.abilities);
                });
            });
    }

}
