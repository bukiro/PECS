import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { featsFeatureName } from './feats.feature';
import { FeatsState } from './feats.state';

const selectFeatsFeature = createFeatureSelector<FeatsState>(
    featsFeatureName,
);

export const selectAllCharacterFeats = createSelector(
    selectFeatsFeature,
    state => state.levelFeats[Defaults.maxCharacterLevel],
);

export const selectAllCharacterFeatsAtLevel = (levelNumber: number): MemoizedSelector<object, Array<Feat>> => createSelector(
    selectFeatsFeature,
    state => Array.from(state.levelFeats[levelNumber].values()),
);

export const selectAllCharacterFeatsTakenAtLevel = (levelNumber: number): MemoizedSelector<object, Array<Feat>> => createSelector(
    selectFeatsFeature,
    state => Array.from(state.levelTakenFeats[levelNumber].values()),
);

export const selectAllCharacterFeatsTaken = createSelector(
    selectFeatsFeature,
    state => state.characterFeatsTaken,
);

export const selectCharacterHasFeatAtLevel = (featName: string, level: number, options?: { allowCountAs?: boolean }): MemoizedSelector<object, boolean> => createSelector(
    selectFeatsFeature,
    state =>
        !!state.levelFeats[level].get(featName.toLowerCase())
            || options?.allowCountAs
            ? !!state.levelCountAs[level].get(featName.toLowerCase())
            : false,
);

export const selectCharacterHasTakenFeatAtLevel = (featName: string, level: number): MemoizedSelector<object, boolean> => createSelector(
    selectFeatsFeature,
    state =>
        !!state.levelTakenFeats[level].get(featName.toLowerCase()),
);
