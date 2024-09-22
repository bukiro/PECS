import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { applyEffectsToValue } from '../../util/effect.utils';

@Injectable({
    providedIn: 'root',
})
export class CreaturePropertiesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) { }

    public effectiveSize$(creature: Creature): Observable<number> {
        return combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Size'),
            this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Size'),
        ])
            .pipe(
                map(([absoluteEffects, relativeEffects]) =>
                    applyEffectsToValue(
                        creature.baseSize(),
                        { absoluteEffects, relativeEffects },
                    ).result),
            );
    }

}
