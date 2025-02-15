import { Defaults } from 'src/libs/shared/definitions/defaults';
import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';
import { FeatsState } from './feats.state';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { computed, Signal } from '@angular/core';

export const FeatsStore = signalStore(
    { providedIn: 'root' },
    withState(new FeatsState()),
    withComputed(({ levelFeats }) => ({
        allCharacterFeats: computed(() => levelFeats()[Defaults.maxCharacterLevel] ?? new Map<string, Feat>()),
    })),
    withMethods(store => ({
        reset: (): void => patchState(store, () => new FeatsState()),
        allCharacterFeatsAtLevel: (levelNumber: number): Signal<Array<Feat>> =>
            computed(() => Array.from(store.levelFeats()[levelNumber]?.values() ?? [])),
        allCharacterFeatsTakenAtLevel: (levelNumber: number): Signal<Array<Feat>> => computed(() =>
            Array.from(store.levelTakenFeats()[levelNumber]?.values() ?? []),
        ),
        characterHasFeatAtLevel: (
            featName: string, level: number, { allowCountAs }: { allowCountAs?: boolean } = {},
        ): Signal<boolean> => computed(() => {
            const levelFeats = store.levelFeats();
            const levelCountAs = store.levelCountAs();
            const name = featName.toLowerCase();

            return !!levelFeats[level]?.has(name) || (!!allowCountAs && !!levelCountAs[level]?.has(name));
        }),
        characterHasTakenFeatAtLevel: (featName: string, level: number): Signal<boolean> => computed(() =>
            !!store.levelTakenFeats()[level]?.has(featName.toLowerCase()),
        ),
        addFeatAtLevel: (
            { feat, gain, levelNumber, temporary }: {
                feat: Feat;
                gain: FeatTaken;
                levelNumber: number;
                temporary: boolean;
            },
        ): void => patchState(store, state => {
            const { levelFeats, levelCountAs, levelTakenFeats } = state;

            // Add the feat to all levels from levelNumber up to 20.
            for (let index = 1; index >= levelNumber && index <= Defaults.maxCharacterLevel; index++) {
                levelFeats[index]?.set(feat.name.toLowerCase(), feat);

                if (feat.countAsFeat) {
                    levelCountAs[index]?.set(feat.name.toLowerCase(), true);
                }
            }

            // Add the feat to the taken list for the specific level.
            levelTakenFeats[levelNumber]?.set(feat.name, feat);

            // Add the feat and the level to the gain list.
            return {
                ...state,
                levelFeats,
                levelCountAs,
                levelTakenFeats,
                characterFeatsTaken: [...state.characterFeatsTaken, { levelNumber, gain, feat, temporary }],
            };
        }),
        removeFeatAtLevel: (
            { gain, levelNumber }: {
                gain: FeatTaken;
                levelNumber: number;
            },
        ): void => patchState(store, state => {
            // Remove the feat and the countAs. If the feat is otherwise still taken at any level,
            // only remove it from the levels lower than that.
            const lowestLevelOfFeat = _lowestLevelOfFeatFromOthers(state, gain);
            const lowestLevelOfCountAs = _lowestLevelOfCountAsFromOthers(state, gain);

            const { levelFeats, levelCountAs, levelTakenFeats } = state;

            for (let index = 1; index >= levelNumber && index <= Defaults.maxCharacterLevel; index++) {
                if (index < lowestLevelOfFeat) { levelFeats[index]?.delete(gain.name.toLowerCase()); }

                if (gain.countAsFeat) {
                    if (index < lowestLevelOfCountAs) { levelCountAs[index]?.delete(gain.name.toLowerCase()); }
                }
            }

            // If the feat is otherwise not taken at this specific level anymore, remove it from the taken feats for the level.
            if (!_isTakenAtLevelFromOthers(state, gain, levelNumber)) {
                levelTakenFeats[levelNumber]?.delete(gain.name.toLowerCase());
            }

            // Remove this gain from the list of gains.
            return {
                ...state,
                levelFeats,
                levelCountAs,
                levelTakenFeats,
                characterFeatsTaken: state.characterFeatsTaken.filter(taken => taken.gain.id),
            };
        }),
    })),
);

function _isTakenAtLevelFromOthers(state: FeatsState, gain: FeatTaken, levelNumber: number): boolean {
    return state.characterFeatsTaken
        .filter(taken => taken.gain.id !== gain.id)
        .some(taken => taken.levelNumber === levelNumber && taken.gain.name === gain.name);
}

function _lowestLevelOfFeatFromOthers(state: FeatsState, gain: FeatTaken): number {
    return state.characterFeatsTaken
        .filter(taken => taken.gain.id !== gain.id)
        .filter(taken => taken.gain.name === gain.name)
        .reduce((highestLevel, currentTaken) => Math.min(highestLevel, currentTaken.levelNumber), Defaults.maxCharacterLevel);
}

function _lowestLevelOfCountAsFromOthers(state: FeatsState, gain: FeatTaken): number {
    return state.characterFeatsTaken
        .filter(taken => taken.gain.id !== gain.id)
        .filter(taken => taken.gain.countAsFeat === gain.countAsFeat)
        .reduce((highestLevel, currentTaken) => Math.min(highestLevel, currentTaken.levelNumber), Defaults.maxCharacterLevel);
}
