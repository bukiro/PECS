import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, switchMap, map, distinctUntilChanged, shareReplay, combineLatest, of } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { selectAllCharacterFeatsAtLevel } from 'src/libs/store/feats/feats.selectors';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureService } from '../creature/creature.service';
import { isDefined } from '../../util/type-guard-utils';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';

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
            this.companionIfAvailable$(levelNumber),
            this.familiarIfAvailable$(levelNumber),
        ])
            .pipe(
                map(creatures => creatures.filter(isDefined)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public companionIfAvailable$(levelNumber?: number): Observable<AnimalCompanion | undefined> {
        return this.isCompanionAvailable$(levelNumber)
            .pipe(
                switchMap(isCompanionAvailable =>
                    isCompanionAvailable
                        ? CreatureService.companion$
                        : of(undefined),
                ),
            );
    }

    public familiarIfAvailable$(levelNumber?: number): Observable<Familiar | undefined> {
        return this.isFamiliarAvailable$(levelNumber)
            .pipe(
                switchMap(isFamiliarAvailable =>
                    isFamiliarAvailable
                        ? CreatureService.familiar$
                        : of(undefined),
                ),
            );
    }
}
