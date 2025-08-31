import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';

@Injectable({
    providedIn: 'root',
})
export class CustomEffectsTimeService {

    public tickCustomEffects(creature: Creature, turns: number): void {
        //Tick down all custom effects and set them to remove when they expire.
        creature.effects.filter(gain => gain.duration > 0).forEach(gain => {
            //Tick down all custom effects and set them to remove when they expire.
            gain.duration -= turns;

            if (gain.duration <= 0) {
                gain.affected = 'DELETE';
            }
        });
        //Remove all effects that were marked for removal.
        creature.effects = creature.effects.filter(gain => gain.affected !== 'DELETE');
    }

}
