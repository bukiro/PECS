import { computed, Signal } from '@angular/core';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { Skill } from '../../models/skill';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { bonusTypes } from 'src/libs/shared/effects/util/models/bonus-types';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { CreatureSkillValueAdapter, SkillValueAggregate } from './creature-skill-value-adapter';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { CreatureSkillLevelAdapter } from '../creature-skill-level-adapter/creature-skill-level-adapter';
import { normalizeSkillName } from '../skill-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { ResultWithBonuses } from 'src/libs/shared/bonuses/util/models/result-with-bonuses';

export class FamiliarSkillValueAdapter extends CreatureSkillValueAdapter {

    // For Familiars, some skill add the character's spellcasting ability
    // with the class that granted the Familiar.
    // Get ability by identifying the non-innate spellcasting
    // with the same class name as the Familiar's originClass and retrieving its key ability.
    // If none can be found, the ability is Charisma.
    private readonly _spellCastingAbility$$ = computed(() =>
        this._character.class().spellCasting()
            .find(spellcasting =>
                stringEqualsCaseInsensitive(spellcasting.className, this._familiar.originClass) &&
                !stringEqualsCaseInsensitive(spellcasting.castingType, 'Innate'),
            )
            ?.ability || 'Charisma',
    );

    private readonly _cache = {
        value: new Map<string, Signal<SkillValueAggregate>>(),
        familiarSaveBaseValue: new Map<string, Signal<ResultWithBonuses<number>>>(),
        familiarPerceptionBaseValue: new Map<string, Signal<ResultWithBonuses<number>>>(),
        familiarSkillBaseValue: new Map<string, Signal<ResultWithBonuses<number>>>(),
    };

    constructor(
        private readonly _familiar: Familiar,
        private readonly _character: Character,
        private readonly _commonAdapter: CreatureSkillCommonAdapter,
        private readonly _levelAdapter: CreatureSkillLevelAdapter,
    ) {
        super();
    }

    public value$$(
        skillOrName: Skill | string,
        charLevel?: number,
        options: { isDC?: boolean; excludeTemporary?: boolean } = {},
    ): Signal<SkillValueAggregate> {
        const skillName = normalizeSkillName(skillOrName);

        const key = `skill=${ skillName }`
            + `charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const skill$$ = this._commonAdapter.normalizeSkill$$(skillOrName);
                const skillLevel$$ = this._levelAdapter.level$$(skillOrName, charLevel, options);

                const effectTargetList$$ = computed(() =>
                    this._valueEffectTargetList(skill$$(), skillLevel$$(), { ...options, ability: '' }),
                );

                const baseValue$$ = computed(() => {
                    const skill = skill$$();
                    const effectTargetList = effectTargetList$$();

                    return this._baseLevel$$(skill, { effectTargetList, charLevel }, options);
                });

                const absolutes$$ = computed(() =>
                    this._familiar.effectsAdapter.absoluteEffectsOnThese$$(effectTargetList$$()),
                );
                const relatives$$ = computed(() =>
                    this._familiar.effectsAdapter.relativeEffectsOnThese$$(
                        effectTargetList$$(),
                        // Familiars cannot benefit from item bonuses.
                        { notOfTypes: [bonusTypes.item] },
                    ),
                );

                return computed(() => {
                    const baseValue = baseValue$$()();
                    const absolutes = absolutes$$()();

                    //Applying assurance prevents any other bonuses, penalties or modifiers.
                    const shouldSkipRelativeEffects = absolutes.some(({ source }) =>
                        stringEqualsCaseInsensitive(source, 'Assurance', { allowPartialString: true }),
                    );

                    const relatives = shouldSkipRelativeEffects ? [] : relatives$$()();
                    const skillLevel = skillLevel$$();

                    // Add the DC value and bonus if applicable.
                    if (options.isDC) {
                        baseValue.result = Defaults.dcBaseValue + baseValue.result;
                        baseValue.bonuses = [
                            { title: 'DC Base Value', value: Defaults.dcBaseValue },
                            ...baseValue.bonuses,
                        ];
                    }

                    // If temporary effects are excluded, the basevalue plus the dc base (if applicable) is enough.
                    if (options.excludeTemporary) {
                        return {
                            ...baseValue,
                            ability: '',
                            skillLevel,
                            effects: [],
                        };
                    }

                    // The familiar's effects are applied and counted as effects to display.
                    return {
                        ...applyEffectsToValue(
                            baseValue.result,
                            {
                                absoluteEffects: absolutes,
                                relativeEffects: relatives,
                                bonuses: baseValue.bonuses,
                                clearBonusesOnAbsolute: true,
                            },
                        ),
                        ability: '',
                        skillLevel,
                        effects: [
                            ...absolutes,
                            ...relatives,
                        ],
                    };
                });
            },
            { store: this._cache.value, key },
        );
    }

    private _baseLevel$$(
        skill: Skill,
        { effectTargetList, charLevel }: { effectTargetList: Array<string>; charLevel?: number },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<ResultWithBonuses<number>> {
        if (stringEqualsCaseInsensitive(skill.type, 'Save')) {
            return this._familiarSaveBaseValue$$(skill, { effectTargetList, charLevel }, options);
        }

        if (stringsIncludeCaseInsensitive(['Perception', 'Acrobatics', 'Stealth'], skill.name)) {
            return this._familiarPerceptionBaseValue$$(skill, charLevel);
        }

        return this._familiarSkillBaseValue$$(skill, charLevel);
    }

    /**
     * On Saves, Familiars apply the character's skill value before circumstance and status effects.
     * Calculates the value of a familiar's save, applying any character bonuses, but not the familiar bonuses yet.
     * The return value is summed up as a single value called "Character's Bonus".
     *
     * @param excludeTemporary Do not apply character effects of any type. Returns only the character's skill value.
     */
    private _familiarSaveBaseValue$$(
        skill: Skill,
        { effectTargetList, charLevel }: { effectTargetList: Array<string>; charLevel?: number },
        options: { excludeTemporary?: boolean } = {},
    ): Signal<ResultWithBonuses<number>> {
        const skillName = skill.name;

        const key = `skill=${ skillName }`
            + `&effectTargetList=${ effectTargetList.join(',') }`
            + `&charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                // For saves, collect the base value from the character without effects.
                const characterSkillValue$$ = this._character.skillsAdapter.skillValue$$(
                    skill,
                    charLevel,
                    { excludeTemporary: true },
                );

                // On Saves, Familiars apply the character's skill value before circumstance and status effects.
                // We source the allowed types of effects here and apply them, before returning the result as the 'Character's Bonus'.
                const characterSaveAbsolutes$$ = this._character.effectsAdapter.absoluteEffectsOnThese$$(effectTargetList);

                const characterSaveRelatives$$ = this._character.effectsAdapter.relativeEffectsOnThese$$(
                    effectTargetList,
                    { notOfTypes: [bonusTypes.circumstance, bonusTypes.status] },
                );

                return computed(() => {
                    const baseValue = characterSkillValue$$();

                    const result =
                        // With excludeTemporary, the character effects are not applied.
                        options.excludeTemporary
                            ? baseValue.result
                            // The value for saves includes character effects, but these are not counted as effects to display.
                            : applyEffectsToValue(
                                baseValue.result,
                                {
                                    absoluteEffects: characterSaveAbsolutes$$(),
                                    relativeEffects: characterSaveRelatives$$(),
                                    bonuses: [],
                                    clearBonusesOnAbsolute: true,
                                },
                            ).result;

                    // The final result is the "Character's Bonus" that constitutes the familiar's save value before effects.
                    const bonuses = [
                        { title: 'Character\'s Bonus', value: result },
                    ];

                    return {
                        result,
                        bonuses,
                    };
                });
            },
            { store: this._cache.familiarSaveBaseValue, key },
        );
    }

    /**
     * Perception, Acrobatics and Stealth are equal to the character level plus spellcasting modifier (or Charisma Modifier).
     *
     * @param excludeTemporary Exclude temporary changes affecting the spellcasting modifier.
     */
    private _familiarPerceptionBaseValue$$(
        skill: Skill,
        charLevel?: number,
        options: { excludeTemporary?: boolean } = {},
    ): Signal<ResultWithBonuses<number>> {
        const key = `skill=${ skill.name }`
            + `&charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const effectiveLevel$$ = this._character.levelOrCurrent$$(charLevel);

                const characterAbilityMod$$ = computed(() => {
                    const ability = this._spellCastingAbility$$();

                    return this._character.abilitiesAdapter.mod$$(ability, charLevel, options);
                });

                return computed(() => {
                    const characterAbilityMod = characterAbilityMod$$()();
                    const effectiveLevel = effectiveLevel$$();

                    const result = effectiveLevel + characterAbilityMod.result;

                    const bonuses = [
                        { title: 'Character Level', value: effectiveLevel },
                    ];

                    if (characterAbilityMod.result) {
                        bonuses.push({
                            title: 'Character Spellcasting Ability',
                            value: characterAbilityMod.result,
                        });
                    }

                    return {
                        result,
                        bonuses,
                    };
                });
            },
            { store: this._cache.familiarPerceptionBaseValue, key },
        );
    }

    /**
     * All skills other than Acrobatics and Stealth (including attack proficiencies) are equal to the character level.
     */
    private _familiarSkillBaseValue$$(
        skill: Skill,
        charLevel?: number,
    ): Signal<ResultWithBonuses<number>> {
        const key = `skill=${ skill.name }`
            + `&charLevel=${ charLevel }`;

        return cachedSignal(
            () => {
                const effectiveLevel$$ = this._character.levelOrCurrent$$(charLevel);

                return computed(() => {
                    const effectiveLevel = effectiveLevel$$();
                    const result = effectiveLevel;

                    const bonuses = [
                        { title: 'Character Level', value: effectiveLevel },
                    ];

                    return {
                        result,
                        bonuses,
                    };
                });
            },
            { store: this._cache.familiarSkillBaseValue, key },
        );
    }
}
