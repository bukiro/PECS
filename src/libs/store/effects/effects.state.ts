import { Effect } from 'src/app/classes/effects/effect';

export interface EffectsState {
    effects: [
        Array<Effect>,
        Array<Effect>,
        Array<Effect>,
    ];
}
