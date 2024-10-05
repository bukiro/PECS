import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Defaults } from '../../definitions/defaults';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { applyEffectsToValue } from '../../util/effect.utils';

@Injectable({
    providedIn: 'root',
})
export class SpellCastingPrerequisitesService {

    public maxFocusPoints$: Observable<number>;

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) {
        this.maxFocusPoints$ = CreatureService.character$
            .pipe(
                switchMap(character =>
                    combineLatest([
                        this._creatureEffectsService.absoluteEffectsOnThis$(character, 'Focus Pool'),
                        this._creatureEffectsService.relativeEffectsOnThis$(character, 'Focus Pool'),
                    ]),
                ),
                map(([absoluteEffects, relativeEffects]) => {
                    const focusPoints = applyEffectsToValue(
                        0,
                        { absoluteEffects, relativeEffects },
                    ).result;

                    return Math.min(focusPoints, Defaults.maxFocusPoints);
                }),
            );
    }

}
