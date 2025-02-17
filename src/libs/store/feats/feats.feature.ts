import { createFeature, createReducer, on } from '@ngrx/store';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';
import { resetCharacter } from '../character/character.actions';
import { addFeatAtLevel, removeFeatAtLevel, resetFeats } from './feats.actions';
import { FeatsState } from './feats.state';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';

export const featsFeatureName = 'feats';

export const initialState: FeatsState = {
    levelFeats: {},
    levelCountAs: {},
    levelTakenFeats: {},
    characterFeatsTaken: [],
};

export const featsFeature = createFeature({
    name: featsFeatureName,
    reducer: createReducer(
        initialState,
        on(resetCharacter, (): FeatsState => initialState),
        on(resetFeats, (): FeatsState => initialState),
        on(addFeatAtLevel, (state, { feat, gain, levelNumber, temporary }): FeatsState => {
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
        // eslint-disable-next-line complexity
        on(removeFeatAtLevel, (state, { gain, levelNumber }): FeatsState => {
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
    ),
});

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
