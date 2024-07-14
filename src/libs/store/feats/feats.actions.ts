import { createAction, props } from '@ngrx/store';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';

export const resetFeats = createAction(
    '[FEATS] Reset feats',
);

export const addFeatAtLevel = createAction(
    '[FEATS] Add feat at level',
    props<{ feat: Feat; gain: FeatTaken; levelNumber: number; temporary: boolean }>(),
);

export const removeFeatAtLevel = createAction(
    '[FEATS] Remove feat at level',
    props<{ gain: FeatTaken; levelNumber: number }>(),
);
