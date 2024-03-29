import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';

@Injectable({
    providedIn: 'root',
})
export class CreaturePropertiesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) { }

    public effectiveSize(creature: Creature): number {
        let size: number = creature.baseSize();

        const setSizeEffects = this._creatureEffectsService.absoluteEffectsOnThis(creature, 'Size');

        if (setSizeEffects.length) {
            size = Math.max(...setSizeEffects.map(effect => parseInt(effect.setValue, 10)));
        }

        const sizeEffects = this._creatureEffectsService.relativeEffectsOnThis(creature, 'Size');

        sizeEffects.forEach(effect => {
            size += parseInt(effect.value, 10);
        });

        return size;
    }

}
