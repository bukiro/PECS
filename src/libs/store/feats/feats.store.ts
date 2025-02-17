import { Defaults } from 'src/libs/shared/definitions/defaults';
import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';
import { FeatsState } from './feats.state';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { computed, Signal } from '@angular/core';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';

export const initialState: FeatsState = {
    levelFeats: {},
    levelCountAs: {},
    levelTakenFeats: {},
    characterFeatsTaken: [],
};

export const FeatsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(({ levelFeats }) => ({
        allCharacterFeats: computed(() => levelFeats()[Defaults.maxCharacterLevel] ?? {}),
    })),
    withMethods(store => ({
        reset: (): void => patchState(store, () => initialState),
        allCharacterFeatsAtLevel: (levelNumber: number): Signal<Array<Feat>> =>
            computed(() => Object.values(store.levelFeats()[levelNumber] ?? {})),
        allCharacterFeatsTakenAtLevel: (levelNumber: number): Signal<Array<Feat>> => computed(() =>
            Object.values(store.levelTakenFeats()[levelNumber] ?? {}),
        ),
        characterHasFeatAtLevel: (
            featName: string, level: number, { allowCountAs }: { allowCountAs?: boolean } = {},
        ): Signal<boolean> => computed(() => {
            const levelFeats = store.levelFeats();
            const levelCountAs = store.levelCountAs();
            const name = featName.toLowerCase();

            return !!levelFeats[level]?.[name] || (!!allowCountAs && !!levelCountAs[level]?.[name]);
        }),
        characterHasTakenFeatAtLevel: (featName: string, level: number): Signal<boolean> => computed(() =>
            !!store.levelTakenFeats()[level]?.[featName.toLowerCase()],
        ),
        addFeatAtLevel: (
            { feat, gain, levelNumber, temporary }: {
                feat: Feat;
                gain: FeatTaken;
                levelNumber: number;
                temporary: boolean;
            },
        ): void => patchState(store, state => {
            const featName = gain.name.toLowerCase();
            const countAsFeatName = gain.countAsFeat.toLowerCase();

            const { levelFeats: { ...levelFeats }, levelCountAs: { ...levelCountAs } } = state;

            // Add the feat to all levels from levelNumber up to 20.
            for (let index = levelNumber; index <= Defaults.maxCharacterLevel; index++) {
                levelFeats[index] = { ...(levelFeats[index] ?? {}), [featName]: feat };

                if (gain.countAsFeat) {
                    levelCountAs[index] = { ...(levelCountAs[index] ?? {}), [countAsFeatName]: true };
                }
            }

            // Add the feat and the level to the gain list.
            return {
                ...state,
                levelFeats,
                levelCountAs,
                // Add the feat to the taken list for the specific level.
                levelTakenFeats: {
                    ...state.levelTakenFeats,
                    [levelNumber]: {
                        ...state.levelTakenFeats[levelNumber],
                        [featName]: feat,
                    },
                },
                characterFeatsTaken: state.characterFeatsTaken.concat({ levelNumber, gain, feat, temporary }),
            };
        }),
        removeFeatAtLevel: (
            { gain, levelNumber }: {
                gain: FeatTaken;
                levelNumber: number;
            },
        // eslint-disable-next-line complexity
        ): void => patchState(store, state => {
            const featName = gain.name.toLowerCase();
            const countAsFeatName = gain.countAsFeat.toLowerCase();

            const { levelFeats: { ...levelFeats }, levelCountAs: { ...levelCountAs }, levelTakenFeats: { ...levelTakenFeats } } = state;

            // Remove the feat and the countAs. If the feat is otherwise still taken at any level,
            // only remove it from the levels lower than that.
            const lowestLevelOfFeatFromOthers = _lowestLevelOfFeatFromOthers(state, gain);
            const lowestLevelOfCountAsFromOthers = _lowestLevelOfCountAsFromOthers(state, gain);

            for (let index = levelNumber; index <= Defaults.maxCharacterLevel; index++) {
                if (levelFeats[index] && (!lowestLevelOfFeatFromOthers || index < lowestLevelOfFeatFromOthers)) {
                    const { [featName]: remove, ...feats } = {
                        ...levelFeats[index],
                    };

                    levelFeats[index] = feats;
                }

                if (
                    gain.countAsFeat
                    && levelCountAs[index]
                    && (!lowestLevelOfCountAsFromOthers || index < lowestLevelOfCountAsFromOthers)
                ) {
                    const { [countAsFeatName]: doRemove, ...entries } = {
                        ...levelCountAs[index],
                    };

                    levelCountAs[index] = entries;
                }
            }

            // If the feat is otherwise not taken at this specific level anymore, remove it from the taken feats for the level.
            if (levelTakenFeats[levelNumber] && !_isTakenAtLevelFromOthers(state, gain, levelNumber)) {
                const { [featName]: remove, ...levelTakenFeatsAtLevel } = {
                    ...levelTakenFeats[levelNumber],
                };

                levelTakenFeats[levelNumber] = { ...levelTakenFeatsAtLevel };
            }

            // Remove this gain from the list of gains.
            return {
                ...state,
                levelFeats,
                levelCountAs,
                levelTakenFeats,
                characterFeatsTaken: state.characterFeatsTaken
                    .filter(taken => !taken.gain.id),
            };
        }),
    })),
);

function _isTakenAtLevelFromOthers(state: FeatsState, gain: FeatTaken, levelNumber: number): boolean {
    return state.characterFeatsTaken
        .some(taken =>
            taken.gain.id !== gain.id
            && taken.levelNumber === levelNumber
            && stringEqualsCaseInsensitive(taken.gain.name, gain.name),
        );
}

function _lowestLevelOfFeatFromOthers(state: FeatsState, gain: FeatTaken): number | undefined {
    return state.characterFeatsTaken
        .filter(taken => taken.gain.id !== gain.id && stringEqualsCaseInsensitive(taken.gain.name, gain.name))
        .reduce<number | undefined>(
        (highestLevel, { levelNumber }) => Math.min(highestLevel ?? Defaults.maxCharacterLevel, levelNumber),
        undefined,
    );
}

function _lowestLevelOfCountAsFromOthers(state: FeatsState, gain: FeatTaken): number | undefined {
    return state.characterFeatsTaken
        .filter(taken => taken.gain.id !== gain.id && stringEqualsCaseInsensitive(taken.gain.countAsFeat, gain.countAsFeat))
        .reduce<number | undefined>(
        (highestLevel, { levelNumber }) => Math.min(highestLevel ?? Defaults.maxCharacterLevel, levelNumber),
        undefined,
    );
}
