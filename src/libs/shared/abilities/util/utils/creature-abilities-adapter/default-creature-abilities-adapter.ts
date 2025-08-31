import { computed, Signal } from '@angular/core';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { Ability } from '../../models/ability';
import { abilityModFromAbilityValue } from 'src/libs/shared/abilities/util/utils/ability-base-value-utils';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CreatureAbilitiesAdapter } from './creature-abilities-adapter';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { CreatureAbilityFactorsAdapter } from '../creature-ability-factors-adapter/creature-ability-factors-adapter';
import { CharacterAbilityFactorsAdapter } from '../creature-ability-factors-adapter/character-ability-factors-adapter';
import { DefaultCreatureAbilityFactorsAdapter } from '../creature-ability-factors-adapter/default-creature-ability-factors-adapter';
import { CreatureAbilityBoostsAdapter } from '../creature-ability-boosts-adapter/creature-ability-boosts-adapter';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { AbilityBoost } from '../../models/ability-boost';
import { CreatureAbilityChoicesAdapter } from '../creature-ability-choices-adapter/creature-ability-choices-adapter';
import { CharacterAbilityChoicesAdapter } from '../creature-ability-choices-adapter/character-ability-choices-adapter';
import { AnimalCompanionAbilityChoicesAdapter } from '../creature-ability-choices-adapter/animal-companion-ability-choices-adapter';
import { AbilityBoostFilter } from '../../models/ability-boost-filter';
import { uniquesOfArray } from 'src/libs/shared/common/util/utils/array-utils';
import { isEqualPrimitiveArray } from 'src/libs/shared/common/util/utils/compare-utils';

export class DefaultCreatureAbilitiesAdapter implements CreatureAbilitiesAdapter {

    public abilityChoices$$;
    public abilityBoosts$$;

    private readonly _factorAdapter: CreatureAbilityFactorsAdapter;
    private readonly _choicesAdapter: CreatureAbilityChoicesAdapter;
    private readonly _boostsAdapter: CreatureAbilityBoostsAdapter;

    private readonly _lookupAbility: (name: string) => Ability;

    private readonly _cache = {
        baseValue: new Map<string, Signal<ResultWithBonuses<number>>>(),
        value: new Map<string, Signal<ResultWithBonuses<number>>>(),
        mod: new Map<string, Signal<ResultWithBonuses<number>>>(),
        allBoostedAbilityNames: new Map<string, Signal<Array<string>>>(),
    };

    constructor(
        private readonly _creature: Character | AnimalCompanion,
        recastFns: RecastFns,
    ) {
        if (_creature.isCharacter()) {
            this._factorAdapter = new CharacterAbilityFactorsAdapter(_creature);
            this._choicesAdapter = new CharacterAbilityChoicesAdapter(_creature);
        } else {
            this._factorAdapter = new DefaultCreatureAbilityFactorsAdapter();
            this._choicesAdapter = new AnimalCompanionAbilityChoicesAdapter(_creature);
        }

        this._boostsAdapter = new CreatureAbilityBoostsAdapter(this._choicesAdapter);

        this.abilityChoices$$ = this._choicesAdapter.abilityChoices$$;
        this.abilityBoosts$$ = this._boostsAdapter.abilityBoosts$$;

        this._lookupAbility = recastFns.getAbility;
    }

    public value$$(
        abilityOrName: Ability | string,
        charLevel?: number,
        options: { excludeTemporary?: boolean } = {},
    ): Signal<ResultWithBonuses<number>> {
        //Calculates the ability with all active effects
        const ability = this._normalizeAbility(abilityOrName);

        const key = `ability=${ ability.name }`
            + `&charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const effectiveBaseValue$$ = this._baseValue$$(abilityOrName, charLevel);

                if (options.excludeTemporary) {
                    return effectiveBaseValue$$;
                }

                const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$(ability.name);
                const relativeEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$(ability.name);

                return computed(() => {
                    const effectiveBaseValue = effectiveBaseValue$$();

                    //Add all active bonuses and penalties to the base value
                    return applyEffectsToValue(
                        effectiveBaseValue.result,
                        {
                            absoluteEffects: absoluteEffects$$(),
                            relativeEffects: relativeEffects$$(),
                            bonuses: effectiveBaseValue.bonuses,
                            clearBonusesOnAbsolute: true,
                        },
                    );
                });
            },
            { store: this._cache.value, key },
        );
    }

    public mod$$(
        abilityOrName: Ability | string,
        charLevel?: number,
        options?: { excludeTemporary?: boolean },
    ): Signal<ResultWithBonuses<number>> {
        const ability = this._normalizeAbility(abilityOrName);

        const key = `ability=${ ability.name }`
            + `charLeve=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const abilityValue$$ = this.value$$(abilityOrName, charLevel, options);
                const absoluteEffects$$ = this._creature.effectsAdapter.absoluteEffectsOnThis$$(`${ ability.name } Modifier`);
                const relativeEffects$$ = this._creature.effectsAdapter.relativeEffectsOnThis$$(`${ ability.name } Modifier`);

                return computed(() => {
                    const abilityValue = abilityValue$$();

                    const abilityMod = abilityModFromAbilityValue(abilityValue.result);
                    const abilityBonusDescription = { title: `Ability value ${ abilityValue.result }`, value: abilityMod };

                    if (options?.excludeTemporary) {
                        return { result: abilityMod, bonuses: [abilityBonusDescription] };
                    }

                    //Add active bonuses and penalties to the ability modifier
                    return applyEffectsToValue(
                        abilityMod,
                        {
                            absoluteEffects: absoluteEffects$$(),
                            relativeEffects: relativeEffects$$(),
                            bonuses: [abilityBonusDescription],
                            clearBonusesOnAbsolute: true,
                        },
                    );
                });
            },
            { store: this._cache.mod, key },
        );
    }

    public allBoostedAbilityNames$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        filter: AbilityBoostFilter = {},
    ): Signal<Array<string>> {
        const key = `&minLevel=${ minLevelNumber }`
            + `&maxLevel=${ maxLevelNumber }`
            + `&filter=${ JSON.stringify(filter) }`;

        return cachedSignal(
            () => {
                const boosts$$ = this.abilityBoosts$$(
                    { minLevelNumber, maxLevelNumber },
                    filter,
                );

                return computed(
                    () => uniquesOfArray(boosts$$().map(({ name }) => name), name => name),
                    { equal: isEqualPrimitiveArray },
                );
            },
            { store: this._cache.allBoostedAbilityNames, key },
        );
    }

    private _baseValue$$(
        abilityOrName: Ability | string,
        charLevel?: number,
    ): Signal<ResultWithBonuses<number>> {
        const ability = this._normalizeAbility(abilityOrName);

        const key = `ability=${ ability.name }`
            + `&charLevel=${ charLevel }`;

        return cachedSignal(
            () => {
                const startingValue$$ = this._factorAdapter.abilityStartingValue$$(ability.name);

                const boosts$$ = computed(() =>
                    this._boostsAdapter.abilityBoosts$$(
                        { minLevelNumber: 0, maxLevelNumber: charLevel },
                        { abilityName: ability.name },
                    ));

                return computed(() => {
                    const startingValue = startingValue$$();

                    const boosts = boosts$$()();

                    return this._abilityValueFromBoosts(
                        boosts,
                        {
                            startingValue,
                            startingBonusDescriptions: [{ title: 'Base Value', value: startingValue }],
                        });
                });
            },
            { store: this._cache.baseValue, key },
        );
    }

    /**
     * Add up all boosts with their appropriate added value, and create bonus descriptions to explain them.
     *
     * @param boosts
     * @param startingValue The value to which all boosts are added, typically the ability base value
     * @param startingBonusDescriptions The initial bonus descriptions to which the boosts are added (typically those for the base value)
     * @returns the final value and all bonus descriptions
     */
    private _abilityValueFromBoosts(
        boosts: Array<AbilityBoost>,
        {
            startingValue,
            startingBonusDescriptions,
        }: {
            startingValue: number;
            startingBonusDescriptions: Array<BonusDescription>;
        },
    ): ResultWithBonuses<number> {
        return boosts.reduce(
            ({ result, bonuses }, boost) => {
                const addedValue = this._factorAdapter.abilityBoostWeight(boost, { currentValue: result });

                return addedValue
                    ? {
                        result: result + addedValue,
                        bonuses: [
                            ...bonuses,
                            { title: `${ boost.source }`, value: addedValue },
                        ],
                    }
                    : { result, bonuses };
            },
            {
                result: startingValue,
                bonuses: startingBonusDescriptions,
            },
        );
    }

    private _normalizeAbility(abilityOrName: Ability | string): Ability {
        if (typeof abilityOrName === 'string') {
            return this._lookupAbility(abilityOrName);
        } else {
            return abilityOrName;
        }
    }

}
