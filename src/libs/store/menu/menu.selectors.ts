import { createFeatureSelector, createSelector } from '@ngrx/store';
import { menuFeatureName } from './menu.feature';
import { MenuState } from './menu.state';

const selectMenuFeature = createFeatureSelector<MenuState>(
    menuFeatureName,
);

export const selectTopMenu = createSelector(
    selectMenuFeature,
    state => state.top,
);

export const selectLeftMenu = createSelector(
    selectMenuFeature,
    state => state.left,
);

export const selectItemsMenuTarget = createSelector(
    selectMenuFeature,
    state => state.itemsMenuTarget,
);
