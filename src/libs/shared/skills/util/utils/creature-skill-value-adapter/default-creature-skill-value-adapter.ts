import { computed, Signal, signal } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { Skill } from '../../models/skill';
import { cachedSignal, weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { CreatureSkillValueAdapter, SkillValueAggregate } from './creature-skill-value-adapter';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { CreatureSkillLevelAdapter } from '../creature-skill-level-adapter/creature-skill-level-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { normalizeSkillName } from '../skill-utils';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { Effect } from 'src/libs/shared/effects/util/models/effect';

export class DefaultCreatureSkillValueAdapter extends CreatureSkillValueAdapter {

    private readonly _cache = {
        value: new Map<string, Signal<SkillValueAggregate>>(),
        baseValue: new Map<string, Signal<SkillValueAggregate>>(),
        modifierAbility: new WeakMap<Skill, Signal<string>>(),
    };

    constructor(
        private readonly _creature: Character | AnimalCompanion,
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
            + `&charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        if (options.excludeTemporary) {
            return this._baseValue$$(skillOrName, charLevel, options);
        }

        return cachedSignal(
            () => {
                const skill$$ = this._commonAdapter.normalizeSkill$$(skillOrName);

                const baseValue$$ = computed(() => this._baseValue$$(skillOrName, charLevel, options));

                const effectTargetList$$ = computed(() => {
                    const baseValue = baseValue$$()();

                    return this._valueEffectTargetList(skill$$(), baseValue.skillLevel, { ...options, ability: baseValue.ability });
                });

                const absolutes$$ = computed(() => this._creature.effectsAdapter.absoluteEffectsOnThese$$(effectTargetList$$()));
                const relatives$$ = computed(() => this._creature.effectsAdapter.relativeEffectsOnThese$$(effectTargetList$$()));

                return computed(() => {
                    const baseValue = baseValue$$()();
                    const absoluteEffects = absolutes$$()();

                    //Applying assurance prevents any other bonuses, penalties or modifiers.
                    const shouldSkipRelativeEffects = absoluteEffects.some(({ source }) =>
                        stringEqualsCaseInsensitive(source, 'Assurance', { allowPartialString: true }),
                    );

                    const relativeEffects = shouldSkipRelativeEffects
                        ? []
                        : relatives$$()();

                    return {
                        ...applyEffectsToValue(
                            baseValue.result,
                            {
                                absoluteEffects,
                                relativeEffects,
                                bonuses: baseValue.bonuses,
                                clearBonusesOnAbsolute: true,
                            },
                        ),
                        ability: baseValue.ability,
                        skillLevel: baseValue.skillLevel,
                        effects: [
                            ...absoluteEffects,
                            ...relativeEffects,
                        ],
                    };
                });
            },
            { store: this._cache.value, key },
        );
    }

    private _baseValue$$(
        skillOrName: Skill | string,
        charLevel?: number,
        options: { isDC?: boolean } = {},
    ): Signal<SkillValueAggregate> {
        const skillName = normalizeSkillName(skillOrName);

        const key = `skill=${ skillName }`
            + `&charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const skill$$ = this._commonAdapter.normalizeSkill$$(skillOrName);
                const skillLevel$$ = this._levelAdapter.level$$(skillOrName, charLevel);
                const effectiveLevel$$ = this._creature.levelOrCurrent$$(charLevel);

                const modifierAbility$$ = computed(() => this._modifierAbility$$(skill$$()));

                const abilityMod$$ = computed(() => {
                    const ability = modifierAbility$$()();

                    return ability
                        ? this._creature.abilitiesAdapter.mod$$(ability, charLevel)
                        : signal(undefined);
                });

                return computed(() => {
                    const effectiveLevel = effectiveLevel$$();
                    const skillLevel = skillLevel$$();

                    const bonuses = new Array<BonusDescription>();
                    let result = 0;

                    if (options.isDC) {
                        result += Defaults.dcBaseValue;
                        bonuses.push({ title: 'DC Base Value', value: Defaults.dcBaseValue });
                    }

                    // Add character level if the character is trained or better with the Skill.
                    if (skillLevel) {
                        result += skillLevel + effectiveLevel;
                        bonuses.push({ title: 'Proficiency Rank', value: skillLevel });
                        bonuses.push({ title: 'Character Level', value: effectiveLevel });
                    }

                    const ability = modifierAbility$$()() ?? '';
                    const abilityMod = abilityMod$$()();

                    if (abilityMod?.result) {
                        result += abilityMod.result;
                        bonuses.push({ title: `${ ability } Modifier`, value: abilityMod.result });
                    }

                    return { result, bonuses, ability, skillLevel, effects: new Array<Effect>() };
                });
            },
            { store: this._cache.baseValue, key },
        );
    }

    private _modifierAbility$$(skill: Skill): Signal<string | undefined> {
        return weaklyCachedSignal(
            () => {
                if (skill.ability) {
                    return signal(skill.ability).asReadonly();
                }

                // Some effects ask for your Unarmed Attacks modifier without any weapon,
                // but Unarmed Attacks is a weapons proficiency and as such does not have an ability,
                // so we apply your strength modifier.
                if (stringEqualsCaseInsensitive(skill.name, 'Unarmed Attacks')) {
                    return signal('Strength').asReadonly();
                }

                // Class DCs on the character, if they don't bring their own ability, can be looked up in ability boosts.
                if (this._creature.isCharacter()) {
                    const character = this._creature;
                    const characterClass = this._creature.class();

                    if (stringEqualsCaseInsensitive(skill.name, 'Class DC', { allowPartialString: true })) {
                        // For the main class DC, the ability is found in the first class key ability boost, on level 1.
                        let source = 'Class Key Ability';
                        let maxLevelNumber = 1;

                        // For other class DCs (i.e. archetypes), the ability is found in the first key ability boost for that class.
                        if (!stringEqualsCaseInsensitive(skill.name, `${ characterClass.name } Class DC`)) {

                            const className = skill.name
                                .toLowerCase()
                                .replace('class dc', '')
                                .trim();

                            source = `${ className } Key Ability`;
                            maxLevelNumber = Defaults.maxCharacterLevel;
                        }

                        const abilityBoosts$$ = character.abilitiesAdapter.abilityBoosts$$(
                            { minLevelNumber: 1, maxLevelNumber },
                            { source },
                        );

                        return computed(() => abilityBoosts$$()[0]?.name);
                    }
                }

                return signal(undefined).asReadonly();
            },
            { store: this._cache.modifierAbility, objKey: skill },
        );


    }

}
