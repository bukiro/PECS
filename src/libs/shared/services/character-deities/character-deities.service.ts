import { Injectable } from '@angular/core';
import { Observable, map, combineLatest, switchMap, of } from 'rxjs';
import { Deity } from 'src/app/classes/deities/deity';
import { CreatureTypes } from '../../definitions/creature-types';
import { propMap$ } from '../../util/observable-utils';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureService } from '../creature/creature.service';
import { DeitiesDataService } from '../data/deities-data.service';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterDeitiesService {

    public mainCharacterDeity$: Observable<Deity | null>;

    constructor(
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _refreshService: RefreshService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        this.mainCharacterDeity$ = propMap$(CharacterFlatteningService.characterClass$, 'deity$')
            .pipe(
                map(deityName =>
                    deityName
                        ? this._deitiesDataService.deityFromName(deityName)
                        : null,
                ),
            );
    }

    public changeDeity(deity: Deity): void {
        const character = CreatureService.character;

        character.class.deity = deity.name;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells', 'clear');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
    }

    public syncretismDeity$(levelNumber?: number): Observable<Deity | null> {
        return combineLatest([
            CharacterFlatteningService.levelOrCurrent$(levelNumber),
            this._characterFeatsService.characterHasFeatAtLevel$('Syncretism', levelNumber),
        ])
            .pipe(
                switchMap(([atLevel, hasSyncretism]) =>
                    hasSyncretism
                        ? CharacterFlatteningService.characterClass$
                            .pipe(
                                switchMap(characterClass => characterClass.filteredFeatData$(0, 0, 'Syncretism')),
                                switchMap(featData =>
                                    (featData[0]?.level && featData[0].level <= atLevel)
                                        ? featData[0].valueAsString$('deity')
                                        : of(null),
                                ),
                                map(deityName =>
                                    deityName
                                        ? this._deitiesDataService.deityFromName(deityName)
                                        : null,
                                ),
                            )
                        : of(null),
                ),
            );
    }

    public currentCharacterDeities$(
        levelNumber?: number,
    ): Observable<Array<Deity>> {
        return this.mainCharacterDeity$
            .pipe(
                switchMap(mainDeity =>
                    // Only return other deities if you have a main deity.
                    mainDeity
                        ? this.syncretismDeity$(levelNumber)
                            .pipe(
                                map(syncretismDeity => ([mainDeity, syncretismDeity])),
                            )
                        : of([]),
                ),
                map(deities => deities.filter((deity): deity is Deity => !!deity)),
            );
    }

}
