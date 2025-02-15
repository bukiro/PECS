import { computed, Injectable, signal, Signal } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { stringEqualsCaseInsensitive } from '../../util/string-utils';
import { CharacterFeatsService } from '../character-feats/character-feats.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureFeatsService {

    constructor(
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    /**
     * Common feat checker for all creatures.
     *
     * @param featName
     * @param context
     * @param filter
     * @param options
     * @returns The amount to which the creature has the feat.
     */
    public creatureHasFeat$$(
        featName: string,
        { creature }: { creature: Creature },
        filter: { charLevel?: number; minLevel?: number } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Signal<number> {
        if (creature.isCharacter()) {
            return computed(() =>
                this._characterFeatsService.characterFeatsTaken$$(
                    filter.minLevel,
                    filter.charLevel,
                    { featName },
                    options,
                )().length,
            );
        } else if (creature.isFamiliar()) {
            return computed(() =>
                creature.abilities
                    .feats()
                    .filter(gain => stringEqualsCaseInsensitive(gain.name, featName)).length,
            );
        } else {
            return signal(0).asReadonly();
        }
    }

}
