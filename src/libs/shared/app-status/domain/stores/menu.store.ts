
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { MenuNames } from 'src/libs/app-shell/util/models/menu-names';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { AppStore } from './app.store';
import { MenuState } from './menu.state';

const initialState: MenuState = {
    top: null,
    left: null,
    itemsMenuTarget: CreatureTypes.Character,
};

export const MenuStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods((store, appStore = inject(AppStore)) => ({
        closeAllMenus: (): void => {
            patchState(store, { top: null, left: null });

            appStore.setCharacterMenuClosed();
        },
        toggleTopMenu: (menu: MenuNames): void => {
            patchState(store, { top: store.top() === menu ? null : menu });

            appStore.setCharacterMenuClosed();
        },
        setTopMenu: (menu: MenuNames): void => patchState(store, { top: menu }),
        toggleLeftMenu: (menu: MenuNames): void => {
            patchState(store, { left: store.left() === menu ? null : menu });

            appStore.setCharacterMenuClosed();
        },
        setLeftMenu: (menu: MenuNames): void => patchState(store, { left: menu }),
        setItemsMenuTarget: (target: CreatureTypes): void => patchState(store, { itemsMenuTarget: target }),
    })),
);
