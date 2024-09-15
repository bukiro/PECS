/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, distinctUntilChanged, map, switchMap } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { addFeatAtLevel, removeFeatAtLevel } from 'src/libs/store/feats/feats.actions';
import {
    selectAllCharacterFeats,
    selectAllCharacterFeatsTaken,
    selectAllCharacterFeatsAtLevel,
    selectAllCharacterFeatsTakenAtLevel,
    selectCharacterHasFeatAtLevel,
    selectCharacterHasTakenFeatAtLevel,
} from 'src/libs/store/feats/feats.selectors';
import { Feat } from '../../definitions/models/feat';
import { FeatTaken } from '../../definitions/models/feat-taken';
import { isEqualPrimitiveObject, isEqualObjectArray, isEqualSerializable } from '../../util/compare-utils';
import { stringEqualsCaseInsensitive } from '../../util/string-utils';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { FeatsDataService } from '../data/feats-data.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterFeatsService {

    constructor(
        private readonly _featsDataService: FeatsDataService,
        private readonly _store$: Store,
    ) { }

    public buildCharacterFeats(character: Character): void {
        // Add all feats that the character has taken to $characterFeats (feat for quick retrieval)
        // and $characterFeatsTaken (gain with level).
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                choice.feats.forEach(takenFeat => {
                    this.addCharacterFeat(
                        this._featsDataService.featOrFeatureFromName(character.customFeats, takenFeat.name),
                        takenFeat,
                        level.number,
                        choice.showOnSheet,
                    );
                });
            });
        });
    }

    public characterFeats$(
        name = '',
        type = '',
        options: { includeSubTypes?: boolean; includeCountAs?: boolean } = {},
    ): Observable<Array<Feat>> {
        return this._store$.select(selectAllCharacterFeats)
            .pipe(
                distinctUntilChanged((previous, current) =>
                    isEqualPrimitiveObject(previous.keys(), current.keys()),
                ),
                map(allFeats => {
                    // If a name is given and other filters are disabled,
                    // we can just get the feat or feature from the map.
                    if (name && !options.includeSubTypes && !options.includeCountAs) {
                        // For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
                        const alternatives = name.toLowerCase().split(' or ');

                        return alternatives
                            .map(alternative => allFeats.get(alternative.toLowerCase()))
                            .filter((feat): feat is Feat => !!feat);
                    }

                    return this._featsDataService.filterFeats(
                        Array.from(allFeats.values()),
                        name,
                        type,
                        options,
                    );
                }),
            );
    }

    public characterFeatsTakenWithContext$(
        minLevelNumber = 0,
        maxLevelNumber?: number,
        filter: { featName?: string; source?: string; sourceId?: string; locked?: boolean; automatic?: boolean } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Observable<Array<{ levelNumber: number; gain: FeatTaken; feat: Feat }>> {
        return this._store$.select(selectAllCharacterFeatsTaken)
            .pipe(
                distinctUntilChanged(isEqualObjectArray((previous, current) =>
                    previous.feat.name === current.feat.name
                    && previous.levelNumber === current.levelNumber
                    && previous.temporary === current.temporary
                    && isEqualSerializable(previous.gain, current.gain),
                )),
                map(allFeatsTaken => allFeatsTaken
                    .filter(taken =>
                        (!minLevelNumber || (taken.levelNumber >= minLevelNumber))
                        && (!maxLevelNumber || (taken.levelNumber <= maxLevelNumber))
                        && (
                            !filter.featName
                            || (options.includeCountAs && stringEqualsCaseInsensitive(taken.gain.countAsFeat, filter.featName))
                            || stringEqualsCaseInsensitive(taken.gain.name, filter.featName)
                        )
                        && (!options.excludeTemporary || !taken.temporary)
                        && (!filter.source || stringEqualsCaseInsensitive(taken.gain.source, filter.source))
                        && (!filter.sourceId || (taken.gain.sourceId === filter.sourceId))
                        && ((filter.locked === undefined) || (taken.gain.locked === filter.locked))
                        && ((filter.automatic === undefined) || (taken.gain.automatic === filter.automatic)),
                    ),
                ),
            );
    }

    public characterFeatsTaken$(
        minLevelNumber = 0,
        maxLevelNumber?: number,
        filter: { featName?: string; source?: string; sourceId?: string; locked?: boolean; automatic?: boolean } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Observable<Array<FeatTaken>> {
        filter = {
            locked: undefined,
            automatic: undefined,
            ...filter,
        };

        return CharacterFlatteningService.levelOrCurrent$(maxLevelNumber)
            .pipe(
                switchMap(targetLevelNumber => this.characterFeatsTakenWithContext$(
                    minLevelNumber,
                    targetLevelNumber,
                    filter,
                    options,
                )),
                map(allTaken => allTaken.map(taken => taken.gain)),
            );
    }

    public addCharacterFeat(feat: Feat, gain: FeatTaken, levelNumber: number, temporary: boolean): void {
        this._store$.dispatch(addFeatAtLevel({ feat, gain, levelNumber, temporary }));
    }

    public removeCharacterFeat(gain: FeatTaken, levelNumber: number): void {
        this._store$.dispatch(removeFeatAtLevel({ gain, levelNumber }));
    }

    /**
     * List all feats that the character has at this level, including those taken at lower levels.
     */
    public characterFeatsAtLevel$(levelNumber?: number): Observable<Array<Feat>> {
        return CharacterFlatteningService.levelOrCurrent$(levelNumber)
            .pipe(
                switchMap(level => this._store$.select(selectAllCharacterFeatsAtLevel(level))),
                distinctUntilChanged(isEqualObjectArray((previous, current) =>
                    previous.name === current.name,
                )),
            );
    }

    /**
     * List all feats that the character has taken at this exact level, not including those taken at lower levels.
     */
    public characterFeatsTakenAtLevel$(levelNumber?: number): Observable<Array<Feat>> {
        return CharacterFlatteningService.levelOrCurrent$(levelNumber)
            .pipe(
                switchMap(level => this._store$.select(selectAllCharacterFeatsTakenAtLevel(level))),
                distinctUntilChanged(isEqualObjectArray((previous, current) =>
                    previous.name === current.name,
                )),
            );
    }

    /**
     * Tell whether the character has a feat by the given name at the given level, including those taken at lower levels.
     * If allowCountAs is true, also count those feats that have the given name in their countAsFeat field.
     */
    public characterHasFeatAtLevel$(name: string, levelNumber?: number, options?: { allowCountAs?: boolean }): Observable<boolean> {
        return CharacterFlatteningService.levelOrCurrent$(levelNumber)
            .pipe(
                switchMap(level => this._store$.select(selectCharacterHasFeatAtLevel(name, level, options))),
                distinctUntilChanged(),
            );
    }

    /**
     * Tell whether the character has taken a feat by the given name at the exact given level, not including those taken at lower levels.
     */
    public characterHasTakenFeatAtLevel$(name: string, levelNumber?: number): Observable<boolean> {
        return CharacterFlatteningService.levelOrCurrent$(levelNumber)
            .pipe(
                switchMap(level => this._store$.select(selectCharacterHasTakenFeatAtLevel(name, level))),
                distinctUntilChanged(),
            );
    }

}
