import { Injectable } from '@angular/core';
import { AbsoluteEffect, Effect, RelativeEffect } from 'src/app/classes/Effect';
import { Creature } from 'src/app/classes/Creature';
import { creatureTypeIDFromType } from 'src/libs/shared/util/creatureUtils';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';
import { map, Observable } from 'rxjs';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from '../../util/stringUtils';
import { Store } from '@ngrx/store';
import {
    replaceEffects,
    selectAbsoluteEffects,
    selectBonusEffects,
    selectEffects,
    selectPenaltyEffects,
    selectRelativeEffects,
    selectToggledEffects,
} from 'src/libs/store/effects';

@Injectable({
    providedIn: 'root',
})
export class CreatureEffectsService {

    constructor(private readonly _store$: Store) { }

    public allCreatureEffects$(creatureType: CreatureTypes): Observable<Array<Effect>> {
        const creatureIndex = creatureTypeIDFromType(creatureType);

        return this._store$.select(selectEffects(creatureIndex));
    }

    public replaceCreatureEffects(creatureType: CreatureTypes, effects: Array<Effect>): void {
        const creatureIndex = creatureTypeIDFromType(creatureType);

        this._store$.dispatch(replaceEffects({ id: creatureIndex, effects }));
    }

    public effectsOnThis$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<Array<Effect>> {
        return this._store$.select(selectEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThis(effects, creature, objectName, options)),
            );
    }

    public toggledEffectsOnThis$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<Array<Effect>> {
        return this._store$.select(selectToggledEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThis(effects, creature, objectName, options)),
            );
    }

    public toggledEffectsOnThese$(creature: Creature, objectNames: Array<string>): Observable<Array<Effect>> {
        return this._store$.select(selectToggledEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThese(effects, creature, objectNames)),
            );
    }

    public relativeEffectsOnThis$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<Array<RelativeEffect>> {
        return this._store$.select(selectRelativeEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThis(effects, creature, objectName, options)),
            );
    }

    public relativeEffectsOnThese$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { lowerIsBetter?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<Array<RelativeEffect>> {
        return this._store$.select(selectRelativeEffects(creature.typeId))
            .pipe(
                map(effects =>
                    // Since there can be an overlap between the different effects we're asking about,
                    // we need to break them down to one bonus and one penalty per effect type.
                    // For individial targets, this is already done during generation.
                    this.reduceRelativesByType(
                        this._effectsApplyingToThese(effects, creature, objectNames),
                        options,
                    ),
                ),
            );
    }

    public absoluteEffectsOnThis$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<Array<AbsoluteEffect>> {
        return this._store$.select(selectAbsoluteEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThis(effects, creature, objectName, options)),
            );
    }

    public absoluteEffectsOnThese$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { lowerIsBetter?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<Array<AbsoluteEffect>> {

        // Since there can be an overlap between the different effects we're asking about,
        // we need to break them down to one bonus and one penalty per effect type.
        return this._store$.select(selectAbsoluteEffects(creature.typeId))
            .pipe(
                map(effects =>
                    this.reduceAbsolutes(
                        this._effectsApplyingToThese(effects, creature, objectNames),
                        options,
                    ),
                ),
            );
    }

    public doBonusEffectsExistOnThis$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return this._store$.select(selectBonusEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThis(effects, creature, objectName, options)),
                map(effects => effects.some(effect => effect.displayed)),
            );
    }

    public doBonusEffectsExistOnThese$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { onlyOfTypes?: Array<BonusTypes> },
    ): Observable<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return this._store$.select(selectBonusEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThese(effects, creature, objectNames, options)),
                map(effects => effects.some(effect => effect.displayed)),
            );
    }

    public doPenaltyEffectsExistOnThis$(
        creature: Creature,
        objectName: string,
        options?: { allowPartialString?: boolean; onlyOfTypes?: Array<BonusTypes> },
    ): Observable<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return this._store$.select(selectPenaltyEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThis(effects, creature, objectName, options)),
                map(effects => effects.some(effect => effect.displayed)),
            );
    }

    public doPenaltyEffectsExistOnThese$(
        creature: Creature,
        objectNames: Array<string>,
        options?: { onlyOfTypes?: Array<BonusTypes> },
    ): Observable<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return this._store$.select(selectPenaltyEffects(creature.typeId))
            .pipe(
                map(effects => this._effectsApplyingToThese(effects, creature, objectNames, options)),
                map(effects => effects.some(effect => effect.displayed)),
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
