import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { featsFeatureName } from './feats.feature';
import { FeatsState } from './feats.state';

const selectFeatsFeature = createFeatureSelector<FeatsState>(
    featsFeatureName,
);

export const selectAllCharacterFeats = createSelector(
    selectFeatsFeature,
    state => state.levelFeats[Defaults.maxCharacterLevel] ?? {},
);

export const selectAllCharacterFeatsAtLevel = (levelNumber: number): MemoizedSelector<object, Array<Feat>> => createSelector(
    selectFeatsFeature,
    state => Object.values(state.levelFeats[levelNumber] ?? {}),
);

export const selectAllCharacterFeatsTakenAtLevel = (levelNumber: number): MemoizedSelector<object, Array<Feat>> => createSelector(
    selectFeatsFeature,
    state => Object.values(state.levelTakenFeats[levelNumber] ?? {}),
);

export const selectAllCharacterFeatsTaken = createSelector(
    selectFeatsFeature,
    state => state.characterFeatsTaken,
);

export const selectCharacterHasFeatAtLevel = (featName: string, level: number, options?: { allowCountAs?: boolean }): MemoizedSelector<object, boolean> => createSelector(
    selectFeatsFeature,
    state =>
        !!state.levelFeats[level]?.[featName.toLowerCase()]
            || options?.allowCountAs
            ? !!state.levelCountAs[level]?.[featName.toLowerCase()]
            : false,
);

export const selectCharacterHasTakenFeatAtLevel = (featName: string, level: number): MemoizedSelector<object, boolean> => createSelector(
    selectFeatsFeature,
    state =>
        !!state.levelTakenFeats[level]?.[featName.toLowerCase()],
);
