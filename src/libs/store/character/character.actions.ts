import { createAction, props } from '@ngrx/store';

export const resetCharacter = createAction(
    '[CHARACTER] Reset',
    props<{ gmMode?: boolean }>(),
);
