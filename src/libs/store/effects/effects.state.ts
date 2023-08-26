import { Effect } from 'src/app/classes/Effect';

export interface EffectsState {
    effects: [
        Array<Effect>,
        Array<Effect>,
        Array<Effect>,
    ];
}
