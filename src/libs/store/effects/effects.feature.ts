import { createFeature, createReducer, on } from '@ngrx/store';
import { Effect } from 'src/app/classes/effects/effect';
import { resetCharacter } from '../character/character.actions';
import { replaceEffects } from './effects.actions';
import { EffectsState } from './effects.state';

export const effectsFeatureName = 'effects';

const initialState: EffectsState = { effects: [new Array<Effect>(), new Array<Effect>(), new Array<Effect>()] };

export const effectsFeature = createFeature({
    name: effectsFeatureName,
    reducer: createReducer(
        initialState,
        on(resetCharacter, (): EffectsState => initialState),
        on(replaceEffects, (state, { id, effects }): EffectsState => ({ ...state, effects: { ...state.effects, [id]: effects } })),
    ),
});
