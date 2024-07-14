import { createAction, props } from '@ngrx/store';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';

export const closeAllMenus = createAction(
    '[MENU] Close all menus',
);

export const toggleTopMenu = createAction(
    '[MENU] Toggle top menu',
    props<{ menu: MenuNames }>(),
);

export const setTopMenu = createAction(
    '[MENU] Set top menu',
    props<{ menu: MenuNames | null }>(),
);

export const toggleLeftMenu = createAction(
    '[MENU] Toggle left menu',
    props<{ menu: MenuNames }>(),
);

export const setLeftMenu = createAction(
    '[MENU] Set left menu',
    props<{ menu: MenuNames | null }>(),
);

export const setItemsMenuTarget = createAction(
    '[MENU] Set items menu target',
    props<{ target: CreatureTypes }>(),
);
