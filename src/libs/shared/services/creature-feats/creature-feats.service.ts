import { Injectable } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { CharacterService } from 'src/app/services/character.service';

import { Creature } from 'src/app/classes/Creature';
import { CharacterFeatsService } from '../character-feats/character-feats.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureFeatsService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public creatureHasFeat(
        feat: Feat,
        context: { creature: Creature },
        filter: { charLevel?: number; minLevel?: number } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): number {
        if (this._characterService?.stillLoading) { return 0; }

        filter = {
            charLevel: this._characterService.character.level,
            minLevel: 1,
            ...filter,
        };

        if (context.creature.isCharacter()) {
            return this._characterFeatsService.characterFeatsTaken(
                filter.minLevel,
                filter.charLevel,
                { featName: feat.name },
                options,
            )?.length || 0;
        } else if (context.creature.isFamiliar()) {
            return context.creature.abilities.feats.filter(gain => gain.name.toLowerCase() === feat.name.toLowerCase())?.length || 0;
        } else {
            return 0;
        }
    }

}
