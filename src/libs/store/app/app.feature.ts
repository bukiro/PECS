import { createFeature, createReducer, on } from '@ngrx/store';
import { resetCharacter } from '../character/character.actions';
import { closeAllMenus, toggleTopMenu, toggleLeftMenu } from '../menu/menu.actions';
import { AppState } from './app.state';

export const appFeatureName = 'app';

const initialState: AppState = {
    characterMenuClosedOnce: false,
    gmMode: false,
};

export const appFeature = createFeature({
    name: appFeatureName,
    reducer: createReducer(
        initialState,
        on(resetCharacter, (state, { gmMode }): AppState => ({ ...initialState, gmMode: gmMode ?? false })),
        on(closeAllMenus, (state): AppState => ({ ...state, characterMenuClosedOnce: true })),
        on(toggleTopMenu, (state): AppState => ({ ...state, characterMenuClosedOnce: true })),
        on(toggleLeftMenu, (state): AppState => ({ ...state, characterMenuClosedOnce: true })),
    ),
});
