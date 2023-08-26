import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map, Observable, switchMap } from 'rxjs';
import { selectAllCharacterFeatsAtLevel } from 'src/libs/store/feats/feats.selectors';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureAvailabilityService {

    constructor(
        private readonly _store$: Store,
    ) { }

    public isCompanionAvailable$(levelNumber?: number): Observable<boolean> {
        //Return whether any feat that you own grants an animal companion at the given level or the current character level.
        return CharacterFlatteningService.levelOrCurrent$(levelNumber)
            .pipe(
                switchMap(resultantLevelNumber =>
                    this._store$.select(selectAllCharacterFeatsAtLevel(resultantLevelNumber)),
                ),
                map(feats => feats.some(feat => feat.gainAnimalCompanion === 'Young')),
                distinctUntilChanged(),
            );
    }

    public isFamiliarAvailable$(levelNumber?: number): Observable<boolean> {
        //Return whether any feat that you own grants a familiar at the given level or the current character level.
        return CharacterFlatteningService.levelOrCurrent$(levelNumber)
            .pipe(
                switchMap(resultantLevelNumber =>
                    this._store$.select(selectAllCharacterFeatsAtLevel(resultantLevelNumber)),
                ),
                map(feats => feats.some(feat => feat.gainFamiliar)),
                distinctUntilChanged(),
            );
    }
}
