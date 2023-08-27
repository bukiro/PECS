import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { selectAllCharacterFeatsAtLevel } from 'src/libs/store/feats/feats.selectors';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { Creature } from 'src/app/classes/Creature';
import { CreatureService } from '../creature/creature.service';

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
                shareReplay({ refCount: true, bufferSize: 1 }),
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
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public allAvailableCreatures$(levelNumber?: number): Observable<Array<Creature>> {
        return combineLatest([
            CreatureService.character$,
            this.isCompanionAvailable$(levelNumber)
                .pipe(
                    switchMap(isCompanionAvailable => isCompanionAvailable ? CreatureService.companion$ : of(undefined)),
                ),
            this.isFamiliarAvailable$(levelNumber)
                .pipe(
                    switchMap(isFamiliarAvailable => isFamiliarAvailable ? CreatureService.familiar$ : of(undefined)),
                ),
        ])
            .pipe(
                map<Array<Creature | undefined>, Array<Creature>>(creatures => creatures
                    .filter((creature): creature is Creature => creature !== undefined),
                ),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }
}
