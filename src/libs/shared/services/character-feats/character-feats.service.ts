import { computed, inject, Injectable, Signal } from '@angular/core';
import { Character } from 'src/app/classes/creatures/character/character';
import { FeatsStore } from 'src/libs/store/feats/feats.store';
import { Feat } from '../../definitions/models/feat';
import { FeatTaken } from '../../definitions/models/feat-taken';
import { isEqualObjectArray, isEqualSerializable, isEqualPrimitiveArray } from '../../util/compare-utils';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { FeatsDataService } from '../data/feats-data.service';
import { Defaults } from '../../definitions/defaults';
import { matchBooleanFilter, matchNumberFilter, matchStringFilter } from '../../util/filter-utils';

@Injectable({
    providedIn: 'root',
})
export class CharacterFeatsService {

    private readonly _featsDataService = inject(FeatsDataService);
    private readonly _featsStore = inject(FeatsStore);

    public buildCharacterFeats(character: Character): void {
        const waitForFeatsDataService = setInterval(() => {
            if (!this._featsDataService.stillLoading) {
                clearInterval(waitForFeatsDataService);

                const customFeats = character.customFeats();

                // Add all feats that the character has taken to the feats store for quick retrieval.
                character.class().levels.forEach(level => {
                    level.featChoices.forEach(choice => {
                        choice.feats.forEach(takenFeat => {
                            this.addCharacterFeat(
                                this._featsDataService.featOrFeatureFromName(customFeats, takenFeat.name),
                                takenFeat,
                                level.number,
                                choice.showOnSheet,
                            );
                        });
                    });
                });
            }
        }, Defaults.waitForServiceDelay);
    }

    public characterFeats$(
        name = '',
        type = '',
        options: { includeSubTypes?: boolean; includeCountAs?: boolean } = {},
    ): Signal<Array<Feat>> {
        const allChacterFeats = computed(
            () => this._featsStore.allCharacterFeats(),
            {
                equal: (previous, current) =>
                    isEqualPrimitiveArray(Object.keys(previous), Object.keys(current)),
            },
        );

        return computed(() => {
            const allFeats = allChacterFeats();

            // If a name is given and other filters are disabled,
            // we can just get the feat or feature from the map.
            if (name && !options.includeSubTypes && !options.includeCountAs) {
                // For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
                const alternatives = name.toLowerCase().split(' or ');

                return alternatives
                    .map(alternative => allFeats[alternative.toLowerCase()])
                    .filter((feat): feat is Feat => !!feat);
            }

            return this._featsDataService.filterFeats(
                Object.values(allFeats),
                name,
                type,
                options,
            );
        });
    }

    public characterFeatsTakenWithContext$$(
        minLevelNumber = 0,
        maxLevelNumber?: number,
        filter: { featName?: string; source?: string; sourceId?: string; locked?: boolean; automatic?: boolean } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Signal<Array<{ levelNumber: number; gain: FeatTaken; feat: Feat }>> {
        const distinctFeats = computed(() => this._featsStore.characterFeatsTaken(), {
            equal: isEqualObjectArray((previous, current) =>
                previous.feat.name === current.feat.name
                && previous.levelNumber === current.levelNumber
                && previous.temporary === current.temporary
                && isEqualSerializable(previous.gain, current.gain),
            ),
        });

        return computed(() => distinctFeats()
            .filter(taken =>
                (!options.excludeTemporary || !taken.temporary)
                && matchNumberFilter({ value: taken.levelNumber, min: minLevelNumber, max: maxLevelNumber })
                && (
                    matchStringFilter({ value: taken.gain.name, match: filter.featName })
                    || (options.includeCountAs && matchStringFilter({ value: taken.gain.countAsFeat, match: filter.featName }))
                )
                && matchStringFilter({ value: taken.gain.source, match: filter.source })
                && matchStringFilter({ value: taken.gain.sourceId, match: filter.sourceId })
                && matchBooleanFilter({ value: taken.gain.locked, match: filter.locked })
                && matchBooleanFilter({ value: taken.gain.automatic, match: filter.automatic }),
            ),
        );
    }

    public characterFeatsTaken$$(
        minLevelNumber = 0,
        maxLevelNumber?: number,
        filter: { featName?: string; source?: string; sourceId?: string; locked?: boolean; automatic?: boolean } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Signal<Array<FeatTaken>> {
        filter = {
            locked: undefined,
            automatic: undefined,
            ...filter,
        };

        return computed(() => {
            const targetLevelNumber = CharacterFlatteningService.levelOrCurrent$$(maxLevelNumber)();

            return this.characterFeatsTakenWithContext$$(
                minLevelNumber,
                targetLevelNumber,
                filter,
                options,
            )()
                .map(({ gain }) => gain);

        });
    }

    public addCharacterFeat(feat: Feat, gain: FeatTaken, levelNumber: number, temporary: boolean): void {
        this._featsStore.addFeatAtLevel({
            feat,
            // Clone the gain to preserve immutability.
            gain: gain.clone(),
            levelNumber,
            temporary,
        });
    }

    public removeCharacterFeat(gain: FeatTaken, levelNumber: number): void {
        this._featsStore.removeFeatAtLevel({ gain, levelNumber });
    }

    /**
     * List all feats that the character has at this level, including those taken at lower levels.
     */
    public characterFeatsAtLevel$$(levelNumber?: number): Signal<Array<Feat>> {
        return computed(
            () => {
                const targetLevelNumber = CharacterFlatteningService.levelOrCurrent$$(levelNumber)();

                return this._featsStore.allCharacterFeatsAtLevel(targetLevelNumber)();
            },
            {
                equal: isEqualObjectArray((previous, current) =>
                    previous.name === current.name,
                ),
            },
        );
    }

    /**
     * List all feats that the character has taken at this exact level, not including those taken at lower levels.
     */
    public characterFeatsTakenAtLevel$$(levelNumber?: number): Signal<Array<Feat>> {
        return computed(
            () => {

                const targetLevelNumber = CharacterFlatteningService.levelOrCurrent$$(levelNumber)();

                return this._featsStore.allCharacterFeatsTakenAtLevel(targetLevelNumber)();
            },
            {
                equal: isEqualObjectArray((previous, current) =>
                    previous.name === current.name,
                ),
            },
        );
    }

    /**
     * Tell whether the character has a feat by the given name at the given level, including those taken at lower levels.
     * If allowCountAs is true, also count those feats that have the given name in their countAsFeat field.
     */
    public characterHasFeatAtLevel$$(name: string, levelNumber?: number, options?: { allowCountAs?: boolean }): Signal<boolean> {
        return computed(() => {
            const targetLevelNumber = CharacterFlatteningService.levelOrCurrent$$(levelNumber)();

            return this._featsStore.characterHasFeatAtLevel(name, targetLevelNumber, options)();
        });
    }

    /**
     * Tell whether the character has taken a feat by the given name at the exact given level, not including those taken at lower levels.
     */
    public characterHasTakenFeatAtLevel$$(name: string, levelNumber?: number): Signal<boolean> {
        return computed(() => {
            const targetLevelNumber = CharacterFlatteningService.levelOrCurrent$$(levelNumber)();

            return this._featsStore.characterHasTakenFeatAtLevel(name, targetLevelNumber)();
        });
    }

}
