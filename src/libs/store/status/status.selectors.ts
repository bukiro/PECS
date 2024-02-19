import { createFeatureSelector, createSelector } from '@ngrx/store';
import { statusFeatureName } from './status.feature';
import { StatusState } from './status.state';

const selectStatusFeature = createFeatureSelector<StatusState>(
    statusFeatureName,
);

export const selectStatus = createSelector(
    selectStatusFeature,
    state => state,
);

export const selectAuthStatus = createSelector(
    selectStatusFeature,
    state => state.auth,
);

export const selectConfigStatus = createSelector(
    selectStatusFeature,
    state => state.config,
);

export const selectCharacterStatus = createSelector(
    selectStatusFeature,
    state => state.character,
);

export const selectDataStatus = createSelector(
    selectStatusFeature,
    state => state.data,
);

export const selectSavegamesStatus = createSelector(
    selectStatusFeature,
    state => state.savegames,
);
