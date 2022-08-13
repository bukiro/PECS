import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class CustomEffectsTimeService {

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public tickCustomEffects(creature: Creature, turns: number): void {
        //Tick down all custom effects and set them to remove when they expire.
        creature.effects.filter(gain => gain.duration > 0).forEach(gain => {
            //Tick down all custom effects and set them to remove when they expire.
            gain.duration -= turns;

            if (gain.duration <= 0) {
                gain.type = 'DELETE';
            }

            this._refreshService.prepareDetailToChange(creature.type, 'effects');
        });
        //Remove all effects that were marked for removal.
        creature.effects = creature.effects.filter(gain => gain.type !== 'DELETE');
    }

}
