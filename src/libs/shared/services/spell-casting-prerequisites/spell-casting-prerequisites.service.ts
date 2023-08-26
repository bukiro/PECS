import { Injectable } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Defaults } from '../../definitions/defaults';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';

@Injectable({
    providedIn: 'root',
})
export class SpellCastingPrerequisitesService {

    public maxFocusPoints$: Observable<number>;

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) {
        this.maxFocusPoints$ = combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThis$(CreatureService.character, 'Focus Pool'),
            this._creatureEffectsService.relativeEffectsOnThis$(CreatureService.character, 'Focus Pool'),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    let focusPoints = 0;

                    absolutes.forEach(effect => {
                        focusPoints = effect.setValueNumerical;
                    });
                    relatives.forEach(effect => {
                        focusPoints += effect.valueNumerical;
                    });

                    return Math.min(focusPoints, Defaults.maxFocusPoints);
                }),
            );
    }

}
