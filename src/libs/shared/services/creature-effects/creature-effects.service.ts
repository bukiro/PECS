import { computed, inject, Injectable, Signal } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect, RelativeEffect, AbsoluteEffect } from 'src/app/classes/effects/effect';
import { BonusTypes } from '../../definitions/bonus-types';
import { CreatureTypes } from '../../definitions/creature-types';
import { creatureTypeIDFromType } from '../../util/creature-utils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from '../../util/string-utils';
import { isEqualSerializableArrayWithoutId } from '../../util/compare-utils';
import { EffectsStore } from 'src/libs/store/effects/effects.store';

@Injectable({
    providedIn: 'root',
})
export class CreatureEffectsService {
    private readonly _effectsStore = inject(EffectsStore);

    public allCreatureEffects$$(creatureType: CreatureTypes): Signal<Array<Effect>> {
        const creatureIndex = creatureTypeIDFromType(creatureType);

        return computed(
            () => this._effectsStore.allEffects(creatureIndex),
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public replaceCreatureEffects(creatureType: CreatureTypes, effects: Array<Effect>): void {
        const creatureIndex = creatureTypeIDFromType(creatureType);

        this._effectsStore.replaceEffects({
            id: creatureIndex,
            // Clone the effects to preserve immutability.
            effects: effects.map(effect => effect.clone()),
        });
    }

    public effectsOnThis$$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<Array<Effect>> {
        const allEffects = computed(
            () => this._effectsStore.allEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThis(effects, creature, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public toggledEffectsOnThis$$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<Array<Effect>> {
        const allEffects = computed(
            () => this._effectsStore.toggledEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThis(effects, creature, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public toggledEffectsOnThese$$(creature: Creature, objectNames: Array<string>): Signal<Array<Effect>> {
        const allEffects = computed(
            () => this._effectsStore.toggledEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThese(effects, creature, objectNames);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public relativeEffectsOnThis$$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<Array<RelativeEffect>> {
        const allEffects = computed(
            () => this._effectsStore.relativeEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThis(effects, creature, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public relativeEffectsOnThese$$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { lowerIsBetter?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<Array<RelativeEffect>> {
        const allEffects = computed(
            () => this._effectsStore.relativeEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                // Since there can be an overlap between the different effects we're asking about,
                // we need to break them down to one bonus and one penalty per effect type.
                return this.reduceRelativesByType(
                    this._effectsApplyingToThese(effects, creature, objectNames),
                    options,
                );
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public absoluteEffectsOnThis$$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<Array<AbsoluteEffect>> {
        const allEffects = computed(
            () => this._effectsStore.absoluteEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThis(effects, creature, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public absoluteEffectsOnThese$$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { lowerIsBetter?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<Array<AbsoluteEffect>> {
        const allEffects = computed(
            () => this._effectsStore.absoluteEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        return computed(
            () => {
                const effects = allEffects();

                // Since there can be an overlap between the different effects we're asking about,
                // we need to break them down to only the strongest effect.
                return this.reduceAbsolutes(
                    this._effectsApplyingToThese(effects, creature, objectNames),
                    options,
                );
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public doBonusEffectsExistOnThis$$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<boolean> {
        const allEffects = computed(
            () => this._effectsStore.bonusEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThis(effects, creature, objectName, options).some(({ displayed }) => displayed);
            },
        );
    }

    public doBonusEffectsExistOnThese$$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { onlyOfTypes?: Array<BonusTypes> },
    ): Signal<boolean> {
        const allEffects = computed(
            () => this._effectsStore.bonusEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThese(effects, creature, objectNames, options)
                    .some(({ displayed }) => displayed);
            },
        );
    }

    public doPenaltyEffectsExistOnThis$$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Signal<boolean> {
        const allEffects = computed(
            () => this._effectsStore.penaltyEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThis(effects, creature, objectName, options).some(({ displayed }) => displayed);
            },
        );
    }

    public doPenaltyEffectsExistOnThese$$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { onlyOfTypes?: Array<BonusTypes> },
    ): Signal<boolean> {
        const allEffects = computed(
            () => this._effectsStore.penaltyEffects(creature.typeId),
            { equal: isEqualSerializableArrayWithoutId },
        );

        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = allEffects();

                return this._effectsApplyingToThese(effects, creature, objectNames, options)
                    .some(({ displayed }) => displayed);
            },
        );
    }

    /**
     * Reduce a batch of absolute effects to the highest one, or the lowest if lower is better.
     *
     * It assumes that these effects come pre-filtered to apply to one specific calculation,
     * i.e. passing all effects for a creature would not be beneficial.
     *
     */
    public reduceAbsolutes(
        effects: Array<AbsoluteEffect>,
        options: { readonly lowerIsBetter?: boolean } = {},
    ): Array<AbsoluteEffect> {
        options = {
            lowerIsBetter: false,
            ...options,
        };

        if (effects.length <= 1) {
            return effects;
        }

        const resultingEffect =
            effects
                .reduce(
                    (
                        prev,
                        current,
                    ) =>
                        // Keep the previous effect if lower is better and the effect is lower than the current;
                        // Otherwise replace it with the next.
                        (options.lowerIsBetter === (prev.setValueNumerical < current.setValueNumerical))
                            ? prev
                            : current,
                );

        return resultingEffect ? [resultingEffect] : [];
    }

    /**
     * Reduce a batch of effects to the highest bonus and the lowest (i.e. worst) penalty per bonus type,
     * since only untyped bonuses stack.
     * Explicitly cumulative effects are added together before comparing.
     * It assumes that these effects come pre-filtered to apply to one specific calculation,
     * i.e. passing all effects for a creature would not be beneficial.
     *
     * Certain relative effects are not allowed if absolute effects exist.
     *
     * @param hasAbsolutes Set if it was previously determined that absolutes exist for the same calculation.
     */
    public reduceRelativesByType(
        effects: Array<RelativeEffect>,
        options: { readonly hasAbsolutes?: boolean; readonly lowerIsBetter?: boolean } = {},
    ): Array<RelativeEffect> {
        options = {
            hasAbsolutes: false,
            lowerIsBetter: false,
            ...options,
        };

        const returnedEffects: Array<RelativeEffect> = [];

        const groupSum = (effectGroup: Array<RelativeEffect>): number =>
            effectGroup.reduce((prev, current) => prev + current.valueNumerical, 0);

        Object.values(BonusTypes)
            .forEach(type => {
                switch (type) {
                    case BonusTypes.Untyped:
                        // If absolutes exist, untyped effects in this batch are ignored.
                        // Otherwise, all untyped effects are kept unfiltered.
                        if (!options.hasAbsolutes) {
                            returnedEffects.push(...effects.filter(effect => effect.type === type));
                        }

                        return;
                    case BonusTypes.Item:
                    case BonusTypes.Proficiency:
                        // If absolutes exist, item and proficiency effects in this batch are ignored.
                        if (options.hasAbsolutes) {
                            return;
                        }
                    //Fall through otherwise
                    default:
                }

                // For all bonus types except untyped, check all and get the highest bonus and the lowest penalty.
                // This respects cumulative effects and returns effects that are cumulative with each other,
                // if their total bonus or penalty is the highest or lowest respectively.
                const { bonusEffectsOfType, penaltyEffectsOfType } =
                    effects
                        .filter(effect => effect.type === type)
                        .reduce(
                            (
                                result: { bonusEffectsOfType: Array<RelativeEffect>; penaltyEffectsOfType: Array<RelativeEffect> },
                                current: RelativeEffect,
                            ) =>
                                current.penalty
                                    ? {
                                        ...result,
                                        penaltyEffectsOfType: [...result.penaltyEffectsOfType, current],
                                    }
                                    : {
                                        ...result,
                                        bonusEffectsOfType: [...result.bonusEffectsOfType, current],
                                    },
                            { bonusEffectsOfType: new Array<RelativeEffect>(), penaltyEffectsOfType: new Array<RelativeEffect>() },
                        );

                //If we have any bonuses for this type, figure out which one is the largest and only get that one.
                // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                if (bonusEffectsOfType.length) {
                    // Every effect is grouped with all effects that includes its source in their cumulative list.
                    // Then we add all those groups up and keep the effects from the one with the highest sum.
                    const effectGroups: Array<Array<RelativeEffect>> = bonusEffectsOfType
                        .map(effect =>
                            [effect].concat(
                                bonusEffectsOfType.filter(otherEffect =>
                                    otherEffect !== effect &&
                                    stringsIncludeCaseInsensitive(otherEffect.cumulative, effect.source),
                                ),
                            ),
                        );

                    returnedEffects.push(
                        ...effectGroups.reduce((prev, current) =>
                            (options.lowerIsBetter === (groupSum(prev) < groupSum(current))) ? prev : current,
                        ),
                    );
                }

                //If we have any penalties for this type, we proceed as with bonuses,
                // only we pick the lowest number (that is, the worst penalty).
                if (penaltyEffectsOfType.length) {
                    // Every effect is grouped with all effects that includes its source in their cumulative list.
                    // Then we add all those groups up and keep the effects from the one with the highest sum.
                    const effectGroups: Array<Array<RelativeEffect>> = penaltyEffectsOfType
                        .map(effect =>
                            [effect].concat(
                                penaltyEffectsOfType.filter(otherEffect =>
                                    otherEffect !== effect &&
                                    stringsIncludeCaseInsensitive(otherEffect.cumulative, effect.source),
                                ),
                            ),
                        );

                    returnedEffects.push(
                        ...effectGroups.reduce((prev, current) =>
                            (options.lowerIsBetter === (groupSum(prev) < groupSum(current)))
                                ? prev
                                : current,
                        ),
                    );
                }
            });

        return returnedEffects;
    }

    private _effectsApplyingToThis<T extends AbsoluteEffect | RelativeEffect | Effect>(
        effects: Array<T>,
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Array<T> {
        return effects
            .filter(effect => this._doesEffectApplyToThis(effect, creature, objectName, options));
    }

    private _effectsApplyingToThese<T extends AbsoluteEffect | RelativeEffect | Effect>(
        effects: Array<T>,
        creature: Creature,
        objectNames: Array<string>,
        options?: { onlyOfTypes?: Array<BonusTypes> },
    ): Array<T> {
        return effects
            .filter(effect => this._doesEffectApplyToThese(effect, creature, objectNames, options));
    }

    private _doesEffectApplyToThis<T extends AbsoluteEffect | RelativeEffect | Effect>(
        effect: T,
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): boolean {
        return (
            effect.creature === creature.id
            && stringEqualsCaseInsensitive(objectName, effect.target, options)
            && !!effect.applied
            && !effect.ignored
            && (!options?.onlyOfTypes || options.onlyOfTypes.includes(effect.type))
        );
    }

    private _doesEffectApplyToThese<T extends AbsoluteEffect | RelativeEffect | Effect>(
        effect: T,
        creature: Creature,
        objectNames: Array<string>,
        options?: { onlyOfTypes?: Array<BonusTypes> },
    ): boolean {
        return (
            effect.creature === creature.id
            && stringsIncludeCaseInsensitive(objectNames, effect.target)
            && !!effect.applied
            && !effect.ignored
            && (!options?.onlyOfTypes || options.onlyOfTypes.includes(effect.type))
        );
    }

}
