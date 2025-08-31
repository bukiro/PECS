import { Signal, computed, signal } from '@angular/core';
import { isEqualSerializableArrayWithoutId } from 'src/libs/shared/common/util/utils/compare-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { BonusTypes } from '../models/bonus-types';
import { Effect, RelativeEffect, AbsoluteEffect, ToggledEffect } from '../models/effect';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { effectsApplyingToThese, effectsApplyingToThis, reduceAbsoluteEffects, reduceRelativeEffectsByType } from './effect-utils';


export class CreatureEffectsAdapter {
    public readonly allEffects$$: Signal<Array<Effect>>;

    public readonly absoluteEffects$$: Signal<Array<AbsoluteEffect>> = computed(
        () => (this.allEffects$$()).filter((effect): effect is AbsoluteEffect => effect.isAbsoluteEffect()),
        { equal: isEqualSerializableArrayWithoutId },
    );

    public readonly toggledEffects$$: Signal<Array<ToggledEffect>> = computed(
        () => (this.allEffects$$()).filter((effect): effect is ToggledEffect => effect.isToggledEffect()),
        { equal: isEqualSerializableArrayWithoutId },
    );

    public readonly relativeEffects$$: Signal<Array<RelativeEffect>> = computed(
        () => (this.allEffects$$()).filter((effect): effect is RelativeEffect => effect.isRelativeEffect()),
        { equal: isEqualSerializableArrayWithoutId },
    );

    public readonly bonusEffects$$: Signal<Array<RelativeEffect>> = computed(
        () => (this.allEffects$$()).filter((effect): effect is RelativeEffect => effect.isRelativeEffect() && !effect.penalty),
        { equal: isEqualSerializableArrayWithoutId },
    );

    public readonly penaltyEffects$$: Signal<Array<RelativeEffect>> = computed(
        () => (this.allEffects$$()).filter((effect): effect is RelativeEffect => effect.isRelativeEffect() && effect.penalty),
        { equal: isEqualSerializableArrayWithoutId },
    );

    public readonly otherCreatureEffects$$: Signal<Array<Effect>> = computed(
        () => this._effects$$().filter(({ creature }) => creature !== this._creature.id),
        { equal: isEqualSerializableArrayWithoutId },
    );

    private readonly _effects$$ = signal<Array<Effect>>([]);

    private readonly _ownEffects$$: Signal<Array<Effect>> = computed(
        () => this._effects$$().filter(({ creature }) => creature === this._creature.id),
        { equal: isEqualSerializableArrayWithoutId },
    );

    private readonly _cache = {
        effectsOnThis: new Map<string, Signal<Array<Effect>>>(),
    };

    constructor(private readonly _creature: Creature) {
        this.allEffects$$ = this._ownEffects$$;
    }

    public replaceEffects(effects: Array<Effect>): void {
        this._effects$$.set(effects.map(effect => effect.clone()));
    }

    public effectsOnThis$$(
        objectName: string,
        options?: {
            allowPartialString?: boolean;
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<Effect>> {
        const key = `name=${ objectName }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => computed(
                () => {
                    const effects = this.allEffects$$();

                    return effectsApplyingToThis(effects, objectName, options);
                },
                { equal: isEqualSerializableArrayWithoutId },

            ),
            { store: this._cache.effectsOnThis, key },
        );
    }

    public toggledEffectsOnThis$$(
        objectName: string,
        options?: {
            allowPartialString?: boolean;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<ToggledEffect>> {
        return computed(
            () => {
                const effects = this.toggledEffects$$();

                return effectsApplyingToThis(effects, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public toggledEffectsOnThese$$(
        objectNames: Array<string>,
        options?: {
            allowPartialString?: boolean;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<ToggledEffect>> {
        return computed(
            () => {
                const effects = this.toggledEffects$$();

                return effectsApplyingToThese(effects, objectNames, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public relativeEffectsOnThis$$(
        objectName: string,
        options?: {
            allowPartialString?: boolean;
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<RelativeEffect>> {
        return computed(
            () => {
                const effects = this.relativeEffects$$();

                return effectsApplyingToThis(effects, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public relativeEffectsOnThese$$(
        objectNames: Array<string>,
        options?: {
            lowerIsBetter?: boolean;
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<RelativeEffect>> {
        return computed(
            () => {
                const effects = this.relativeEffects$$();

                // Since there can be an overlap between the different effects we're asking about,
                // we need to break them down to one bonus and one penalty per effect type.
                return reduceRelativeEffectsByType(
                    effectsApplyingToThese(effects, objectNames, options),
                    options,
                );
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public absoluteEffectsOnThis$$(
        objectName: string,
        options?: {
            allowPartialString?: boolean;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<AbsoluteEffect>> {
        return computed(
            () => {
                const effects = this.absoluteEffects$$();

                return effectsApplyingToThis(effects, objectName, options);
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public absoluteEffectsOnThese$$(
        objectNames: Array<string>,
        options?: {
            lowerIsBetter?: boolean;
            excludeTemporary?: boolean;

        },
    ): Signal<Array<AbsoluteEffect>> {
        return computed(
            () => {
                const effects = this.absoluteEffects$$();

                // Since there can be an overlap between the different effects we're asking about,
                // we need to break them down to only the strongest effect.
                return reduceAbsoluteEffects(
                    effectsApplyingToThese(effects, objectNames, options),
                    options,
                );
            },
            { equal: isEqualSerializableArrayWithoutId },
        );
    }

    public doBonusEffectsExistOnThis$$(
        objectName: string,
        options?: {
            allowPartialString?: boolean;
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = this.bonusEffects$$();

                return effectsApplyingToThis(effects, objectName, options)
                    .some(({ displayed }) => displayed);
            },
        );
    }

    public doBonusEffectsExistOnThese$$(
        objectNames: Array<string>,
        options?: {
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = this.bonusEffects$$();

                return effectsApplyingToThese(effects, objectNames, options)
                    .some(({ displayed }) => displayed);
            },
        );
    }

    public doPenaltyEffectsExistOnThis$$(
        objectName: string,
        options?: {
            allowPartialString?: boolean;
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = this.penaltyEffects$$();

                return effectsApplyingToThis(effects, objectName, options)
                    .some(({ displayed }) => displayed);
            },
        );
    }

    public doPenaltyEffectsExistOnThese$$(
        objectNames: Array<string>,
        options?: {
            onlyOfTypes?: Array<BonusTypes>;
            notOfTypes?: Array<BonusTypes>;
            excludeTemporary?: boolean;

        },
    ): Signal<boolean> {
        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return computed(
            () => {
                const effects = this.penaltyEffects$$();

                return effectsApplyingToThese(effects, objectNames, options)
                    .some(({ displayed }) => displayed);
            },
        );
    }

}
