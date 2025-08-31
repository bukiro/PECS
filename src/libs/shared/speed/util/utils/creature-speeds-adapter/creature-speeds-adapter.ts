import { computed, Signal } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { Effect } from 'src/libs/shared/effects/util/models/effect';
import { CreatureBaseSpeedAdapter } from '../creature-base-speed-adapter/creature-base-speed-adapter';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { FamiliarBaseSpeedAdapter } from '../creature-base-speed-adapter/familiar-base-speed-adapter';
import { DefaultCreatureBaseSpeedAdapter } from '../creature-base-speed-adapter/default-creature-base-speed-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { matchFlagFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { Speed } from '../../models/speed';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';

interface SpeedAggregate {
    name: string;
    result: number;
    bonuses: Array<BonusDescription>;
    effects: Array<Effect>;
}

const minimumLoweredSpeed = 5;

export class CreatureSpeedsAdapter {

    /**
     * Collect all speeds that the creature has, from its base and from effects.
     * Only includes absolute effects, as gaining speeds is always an absolute effect.
     *
     * @param excludeTemporary Ignore any speed effects that are not from feats
     */
    public readonly currentSpeeds$$: Signal<Array<Speed>>;

    private readonly _currentSpeedNames$$: Signal<Array<string>> = computed(() =>
        this.currentSpeeds$$().map(({ name }) => name),
    );

    private readonly _baseSpeedAdapter: CreatureBaseSpeedAdapter;

    private readonly _cache = {
        value: new Map<string, Signal<SpeedAggregate>>(),
        speedsAtLevel: new Map<number, Signal<Array<string>>>(),
    };

    constructor(
        private readonly _creature: Character | Familiar | AnimalCompanion,
    ) {
        if (_creature.isFamiliar()) {
            this._baseSpeedAdapter = new FamiliarBaseSpeedAdapter(_creature);
        } else {
            this._baseSpeedAdapter = new DefaultCreatureBaseSpeedAdapter(_creature);
        }

        this.currentSpeeds$$ = (() => {
            const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$(' Speed');

            return computed(
                () =>
                    [
                        ...this._baseSpeedAdapter.inherentSpeeds$$(),
                        ...absoluteEffects$$().map(({ target, setValueNumerical, source }) =>
                            Speed.from({
                                value: setValueNumerical,
                                name: target,
                                source,
                            }),
                        ),
                    ],
                { equal: isEqualSerializableArray },
            );
        })();
    }

    /**
     * Return the value of the named speed.
     *
     * @param excludeTemporary Ignore any speed effects that are not from feats
     */
    public value$$(name: string, options: { excludeTemporary?: boolean } = {}): Signal<SpeedAggregate> {
        const key = `name=${ name }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const baseSpeed$$ = this._baseSpeedAdapter.baseSpeed$$(name);
                const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$(name, options);
                const relativeEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$(name, options);
                const generalSpeedEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$('Speed', options);

                return computed(() => {
                    const absoluteEffects = absoluteEffects$$().filter(effect =>
                        matchFlagFilter({
                            value: !!effect.fromEvolution,
                            flag: options.excludeTemporary,
                        }),
                    );
                    const relativeEffects = relativeEffects$$().filter(effect =>
                        matchFlagFilter({
                            value: !!effect.fromEvolution,
                            flag: options.excludeTemporary,
                        }),
                    );

                    // Start off with the creature's ancestry speed.
                    let baseValue: SpeedAggregate = {
                        ...baseSpeed$$(),
                        name,
                        effects: [
                            ...absoluteEffects,
                            ...relativeEffects,
                        ],
                    };

                    const isGeneralSpeed = stringEqualsCaseInsensitive(name, 'Speed');
                    const isZeroInitially = baseValue.result <= 0;

                    ({ ...baseValue } = {
                        ...baseValue,
                        ...applyEffectsToValue(
                            baseValue.result,
                            {
                                absoluteEffects,
                                bonuses: baseValue.bonuses,
                            },
                        ),
                    });

                    const isZeroViaAbsolutes = !isZeroInitially && baseValue.result <= 0;

                    ({ ...baseValue } = {
                        ...baseValue,
                        ...applyEffectsToValue(
                            baseValue.result,
                            {
                                relativeEffects,
                                bonuses: baseValue.bonuses,
                            },
                        ),
                    });

                    // The general speed is a bonus to all other speeds, so it can be positive or negative.
                    // There is no need to normalize it, so it can be returned directly.
                    if (isGeneralSpeed) {
                        return baseValue;
                    }

                    // If there is a general speed penalty (or bonus), it applies to all speeds.
                    // This is added on top of the base result for each other speed.
                    const generalSpeedEffects = generalSpeedEffects$$().filter(effect =>
                        matchFlagFilter({
                            value: !!effect.fromEvolution,
                            flag: options.excludeTemporary,
                        }),
                    );

                    ({ ...baseValue } = {
                        ...baseValue,
                        ...applyEffectsToValue(
                            baseValue.result,
                            {
                                relativeEffects: generalSpeedEffects,
                                bonuses: baseValue.bonuses,
                            },
                        ),
                        effects: [
                            ...baseValue.effects,
                            ...generalSpeedEffects,
                        ],
                    });

                    const isZeroViaRelatives = !isZeroInitially && !isZeroViaAbsolutes && baseValue.result <= minimumLoweredSpeed;

                    // For relative effects, penalties cannot lower a speed below 5.
                    // If the speed is lower than that from relative effects, fix it and return the fixed value.
                    if (isZeroViaRelatives) {
                        return {
                            ...baseValue,
                            result: minimumLoweredSpeed,
                            bonuses: [
                                ...baseValue.bonuses,
                                {
                                    value: minimumLoweredSpeed,
                                    title: `Effects cannot lower a speed below ${ minimumLoweredSpeed }.`,
                                },
                            ],
                        };
                    }

                    // In all other cases, the value can be returned as is:
                    // - if it is not 0
                    // - if it was 0 in the first place
                    // - if it was set to 0 via absolute effects
                    return baseValue;
                });
            },
            { store: this._cache.value, key },
        );
    }

    /**
     * Collect all speeds that the creature has without temporary effects, from its base and from feats.
     */
    public speedsAtLevel$$(charLevel?: number): Signal<Array<string>> {
        if (charLevel === undefined) {
            return this._currentSpeedNames$$;
        }

        return cachedSignal(
            () => {
                const feats$$ = this._creature.featsAdapter.featsAtLevel$$(charLevel, { excludeTemporary: true });

                return computed(() =>
                    Array.from(new Set([
                        ...this._baseSpeedAdapter.inherentSpeeds$$().map(({ name }) => name),
                        ...feats$$()
                            .flatMap(({ effects }) =>
                                effects
                                    .filter(effect =>
                                        stringEqualsCaseInsensitive(effect.affected, ' Speed', { allowPartialString: true })
                                        && !effect.toggle
                                        && !!effect.setValue,
                                    )
                                    .map(({ affected }) => affected),
                            ),
                    ])),
                );
            },
            { store: this._cache.speedsAtLevel, key: charLevel },
        );
    }
}
