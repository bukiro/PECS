import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
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
    public creatureHasFeat$(
        featName: string,
        context: { creature: Creature },
        filter: { charLevel?: number; minLevel?: number } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Observable<number> {
        if (context.creature.isCharacter()) {
            return this._characterFeatsService.characterFeatsTaken$(
                filter.minLevel,
                filter.charLevel,
                { featName },
                options,
            )
                .pipe(
                    map(featsTaken => featsTaken.length),
                );
        } else if (context.creature.isFamiliar()) {
            return of(context.creature.abilities.feats.filter(gain => stringEqualsCaseInsensitive(gain.name, featName))?.length ?? 0);
        } else {
            return of(0);
        }
    }

}
