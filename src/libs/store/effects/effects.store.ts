import { AbsoluteEffect, Effect, RelativeEffect } from 'src/app/classes/effects/effect';
import { EffectsState } from './effects.state';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';

const initialState: EffectsState = { effects: {
    [CreatureTypeIds.Character]: new Array<Effect>(),
    [CreatureTypeIds.AnimalCompanion]: new Array<Effect>(),
    [CreatureTypeIds.Familiar]: new Array<Effect>(),
} };

export const EffectsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods(store => ({
        reset: (): void => patchState(store, () => initialState),
        replaceEffects: ({ id, effects }: { id: CreatureTypeIds; effects: Array<Effect> }): void =>
            patchState(store, state => ({
                ...state,
                effects: {
                    ...state.effects,
                    [id]: effects,
                },
            })),
        allEffects: (id: CreatureTypeIds): Array<Effect> => store.effects()[id] ?? [],
        absoluteEffects: (id: CreatureTypeIds): Array<AbsoluteEffect> =>
            (store.effects()[id] ?? []).filter((effect): effect is AbsoluteEffect => effect.isAbsoluteEffect()),
        toggledEffects: (id: CreatureTypeIds): Array<Effect> =>
            (store.effects()[id] ?? []).filter(effect => effect.toggled),
        relativeEffects: (id: CreatureTypeIds): Array<RelativeEffect> =>
            (store.effects()[id] ?? []).filter((effect): effect is RelativeEffect => effect.isRelativeEffect()),
        bonusEffects: (id: CreatureTypeIds): Array<RelativeEffect> =>
            (store.effects()[id] ?? []).filter((effect): effect is RelativeEffect => effect.isRelativeEffect() && !effect.penalty),
        penaltyEffects: (id: CreatureTypeIds): Array<RelativeEffect> =>
            (store.effects()[id] ?? []).filter((effect): effect is RelativeEffect => effect.isRelativeEffect() && effect.penalty),
    })),
);
