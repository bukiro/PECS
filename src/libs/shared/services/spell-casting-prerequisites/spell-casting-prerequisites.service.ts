import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { Defaults } from '../../definitions/defaults';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';

@Injectable({
    providedIn: 'root',
})
export class SpellCastingPrerequisitesService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) { }

    public maxFocusPoints(): number {
        let focusPoints = 0;

        this._creatureEffectsService.absoluteEffectsOnThis(this._characterService.character, 'Focus Pool').forEach(effect => {
            focusPoints = parseInt(effect.setValue, 10);
        });
        this._creatureEffectsService.relativeEffectsOnThis(this._characterService.character, 'Focus Pool').forEach(effect => {
            focusPoints += parseInt(effect.value, 10);
        });

        return Math.min(focusPoints, Defaults.maxFocusPoints);
    }

}
