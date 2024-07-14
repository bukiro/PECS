import { createFeature, createReducer, on } from '@ngrx/store';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { closeAllMenus, toggleTopMenu, toggleLeftMenu, setItemsMenuTarget, setTopMenu, setLeftMenu } from './menu.actions';
import { MenuState } from './menu.state';

export const menuFeatureName = 'menu';

const initialState: MenuState = {
    top: null,
    left: null,
    itemsMenuTarget: CreatureTypes.Character,
};

export const menuFeature = createFeature({
    name: menuFeatureName,
    reducer: createReducer(
        initialState,
        on(closeAllMenus, (state): MenuState => ({ ...state, top: null, left: null })),
        on(toggleTopMenu, (state, { menu }): MenuState => ({ ...state, top: state.top === menu ? null : menu })),
        on(setTopMenu, (state, { menu }): MenuState => ({ ...state, top: menu })),
        on(toggleLeftMenu, (state, { menu }): MenuState => ({ ...state, left: state.left === menu ? null : menu })),
        on(setLeftMenu, (state, { menu }): MenuState => ({ ...state, left: menu })),
        on(setItemsMenuTarget, (state, { target }): MenuState => ({ ...state, itemsMenuTarget: target })),
    ),
});
