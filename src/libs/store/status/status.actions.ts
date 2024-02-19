import { createAction, props } from '@ngrx/store';
import { ApiStatus } from 'src/libs/shared/definitions/interfaces/api-status';

export const closeCharacter = createAction(
    '[STATUS] Close character',
);

export const setAuthStatus = createAction(
    '[STATUS] Set auth status',
    props<{ status: ApiStatus }>(),
);

export const setConfigStatus = createAction(
    '[STATUS] Set config status',
    props<{ status: ApiStatus }>(),
);

export const setCharacterStatus = createAction(
    '[STATUS] Set character status',
    props<{ status: ApiStatus }>(),
);

export const setSavegamesStatus = createAction(
    '[STATUS] Set savegames status',
    props<{ status: ApiStatus }>(),
);

export const setDataStatus = createAction(
    '[STATUS] Set data status',
    props<{ status: ApiStatus }>(),
);
