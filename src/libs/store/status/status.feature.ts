import { createFeature, createReducer, on } from '@ngrx/store';
import { ApiStatusKey } from 'src/libs/shared/definitions/apiStatusKey';
import { closeCharacter, setConfigStatus, setCharacterStatus, setDataStatus, setSavegamesStatus } from './status.actions';
import { StatusState } from './status.state';

export const statusFeatureName = 'status';

const initialState: StatusState = {
    config: { key: ApiStatusKey.Initializing, message: 'Initializing...' },
    character: { key: ApiStatusKey.NoCharacter },
    data: { key: ApiStatusKey.Initializing },
    savegames: { key: ApiStatusKey.Initializing },
};

export const statusFeature = createFeature({
    name: statusFeatureName,
    reducer: createReducer(
        initialState,
        on(closeCharacter, (state): StatusState => ({ ...state, character: { key: ApiStatusKey.NoCharacter } })),
        on(setConfigStatus, (state, { status }): StatusState => ({ ...state, config: status })),
        on(setCharacterStatus, (state, { status }): StatusState => ({ ...state, character: status })),
        on(setDataStatus, (state, { status }): StatusState => ({ ...state, data: status })),
        on(setSavegamesStatus, (state, { status }): StatusState => ({ ...state, savegames: status })),
    ),
});
