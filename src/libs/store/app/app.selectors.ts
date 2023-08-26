import { createFeatureSelector, createSelector } from '@ngrx/store';
import { appFeatureName } from './app.feature';
import { AppState } from './app.state';

const selectAppFeature = createFeatureSelector<AppState>(
    appFeatureName,
);

export const selectCharacterMenuClosedOnce = createSelector(
    selectAppFeature,
    state => state.characterMenuClosedOnce,
);

export const selectGmMode = createSelector(
    selectAppFeature,
    state => state.gmMode,
);
