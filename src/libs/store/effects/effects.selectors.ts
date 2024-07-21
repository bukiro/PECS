import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { AbsoluteEffect, Effect, RelativeEffect } from 'src/app/classes/effects/effect';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { effectsFeatureName } from './effects.feature';
import { EffectsState } from './effects.state';

const selectAllEffects = createFeatureSelector<EffectsState>(
    effectsFeatureName,
);

export const selectEffects =
    (id: CreatureTypeIds): MemoizedSelector<object, Array<Effect>> =>
        createSelector(
            selectAllEffects,
            state => state.effects[id] ?? new Array<Effect>(),
        );

export const selectAbsoluteEffects = (id: CreatureTypeIds): MemoizedSelector<object, Array<AbsoluteEffect>> =>
    createSelector(
        selectEffects(id),
        effects => effects
            .filter((effect): effect is AbsoluteEffect => effect.hasSetValue),
    );

export const selectToggledEffects = (id: CreatureTypeIds): MemoizedSelector<object, Array<Effect>> =>
    createSelector(
        selectEffects(id),
        effects => effects
            .filter(effect => effect.toggled),
    );

export const selectRelativeEffects = (id: CreatureTypeIds): MemoizedSelector<object, Array<RelativeEffect>> =>
    createSelector(
        selectEffects(id),
        effects => effects
            .filter(effect => !!effect.valueNumerical),
    );

export const selectBonusEffects = (id: CreatureTypeIds): MemoizedSelector<object, Array<RelativeEffect>> =>
    createSelector(
        selectRelativeEffects(id),
        effects => effects
            .filter(effect => !effect.penalty),
    );

export const selectPenaltyEffects = (id: CreatureTypeIds): MemoizedSelector<object, Array<RelativeEffect>> =>
    createSelector(
        selectRelativeEffects(id),
        effects => effects
            .filter(effect => effect.penalty),
    );
