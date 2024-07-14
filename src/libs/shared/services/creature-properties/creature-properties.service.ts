import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';

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
                map(([absolutes, relatives]) => {
                    let size: number = creature.baseSize();

                    if (absolutes.length) {
                        size = Math.max(...absolutes.map(effect => effect.setValueNumerical));
                    }

                    relatives.forEach(effect => {
                        size += effect.valueNumerical;
                    });

                    return size;
                }),
            );
    }

}
