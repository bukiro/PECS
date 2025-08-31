import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AppState } from './app.state';

const initialState: AppState = {
    characterMenuClosedOnce: false,
    gmMode: false,
};

export const AppStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods(store => ({
        resetCharacter: ({ gmMode }: { gmMode?: boolean } = {}): void => patchState(store, { ...initialState, gmMode: gmMode ?? false }),
        setCharacterMenuClosed: (): void => patchState(store, { characterMenuClosedOnce: true }),
    })),
);
