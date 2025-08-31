import { computed } from '@angular/core';
import { StatusState } from './status.state';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ApiStatus } from 'src/libs/shared/api/util/models/api-status';
import { ApiStatusKey } from 'src/libs/shared/api/util/models/api-status-key';

const initialState: StatusState = {
    auth: { key: ApiStatusKey.Initializing, message: 'Connecting...' },
    config: { key: ApiStatusKey.Initializing, message: 'Initializing...' },
    character: { key: ApiStatusKey.NoCharacter },
    data: { key: ApiStatusKey.Initializing },
    savegames: { key: ApiStatusKey.Initializing },
};

export const StatusStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withComputed(store => ({
        all: computed(() => ([
            store.auth(),
            store.config(),
            store.character(),
            store.data(),
            store.savegames(),
        ])),
    })),
    withMethods(store => ({
        closeCharacter: (): void => patchState(store, { character: { key: ApiStatusKey.NoCharacter } }),
        setConfigStatus: (status: ApiStatus): void => patchState(store, { config: status }),
        setAuthStatus: (status: ApiStatus): void => patchState(store, { auth: status }),
        setCharacterStatus: (status: ApiStatus): void => patchState(store, { character: status }),
        setDataStatus: (status: ApiStatus): void => patchState(store, { data: status }),
        setSavegamesStatus: (status: ApiStatus): void => patchState(store, { savegames: status }),
    })),
);
