import { computed, Signal } from '@angular/core';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { ProficiencyCopyGain } from 'src/libs/shared/feats/util/models/proficiency-copy-gain';
import { Skill } from '../../models/skill';
import { SkillLevels } from '../../models/skill-levels';
import { matchNumberFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { groupArray } from 'src/libs/shared/common/util/utils/array-utils';
import { normalizeSkillName, skillLevelFromIncreases } from '../skill-utils';
import { CreatureSkillLevelAdapter } from './creature-skill-level-adapter';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Character } from 'src/libs/shared/character/util/models/character';
import { CreatureSkillCommonAdapter } from '../creature-skill-common-adapter/creature-skill-common-adapter';
import { CreatureSkillIncreasesAdapter } from '../creature-skill-increases-adapter/creature-skill-increases-adapter';

export class DefaultCreatureSkillLevelAdapter implements CreatureSkillLevelAdapter {

    private readonly _cache = {
        baseLevel: new Map<string, Signal<number>>(),
        level: new Map<string, Signal<number>>(),
        skillLevelFromIncreases: new Map<string, Signal<number>>(),
        proficiencyCopySkillLevels: new Map<string, Signal<Array<number>>>(),
    };

    constructor(
        private readonly _creature: Character | AnimalCompanion,
        private readonly _commonAdapter: CreatureSkillCommonAdapter,
        private readonly _increasesAdapter: CreatureSkillIncreasesAdapter,
    ) { }

    /**
     * Determines the skill level at the given character level.
     *
     * @param excludeTemporary Skips increases from items and changes from effects. This should be used for checking requirements.
     */
    public level$$(
        skillOrName: Skill | string,
        charLevel?: number,
        options?: { excludeTemporary?: boolean },
    ): Signal<number> {
        const skillName = normalizeSkillName(skillOrName);

        const key = `skill=${ skillName }`
            + `&level=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        if (options?.excludeTemporary) {
            return this._baseLevel$$(skillOrName, charLevel, options);
        }

        return cachedSignal(
            () => {
                const skill$$ = this._commonAdapter.normalizeSkill$$(skillOrName);

                const effectTargetList$$ = computed(() => this._levelEffectTargetList(skill$$()));

                const absolutes$$ = computed(() => this._creature.effectsAdapter.absoluteEffectsOnThese$$(effectTargetList$$()));
                const relatives$$ = computed(() => this._creature.effectsAdapter.relativeEffectsOnThese$$(effectTargetList$$()));

                const baseSkillLevel$$ = this._baseLevel$$(skillOrName, charLevel);

                const withEffects$$ = computed(() =>
                    //Add any valid relative proficiency effects.
                    applyEffectsToValue(
                        baseSkillLevel$$(),
                        {
                            absoluteEffects:
                                absolutes$$()()
                                    .filter(effect =>
                                        [
                                            SkillLevels.Untrained,
                                            SkillLevels.Trained,
                                            SkillLevels.Expert,
                                            SkillLevels.Master,
                                            SkillLevels.Legendary,
                                        ].includes(effect.setValueNumerical),
                                    ),
                            relativeEffects:
                                relatives$$()()
                                    .filter(effect =>
                                        [
                                            -SkillLevels.Legendary,
                                            -SkillLevels.Master,
                                            -SkillLevels.Expert,
                                            -SkillLevels.Trained,
                                            SkillLevels.Trained,
                                            SkillLevels.Expert,
                                            SkillLevels.Master,
                                            SkillLevels.Legendary,
                                        ].includes(effect.valueNumerical),
                                    ),
                        },
                    ).result,
                );

                return computed(() =>
                    // Clamp the skill level between untrained and legendary.
                    Math.max(Math.min(withEffects$$(), SkillLevels.Legendary), SkillLevels.Untrained),
                );
            },
            { store: this._cache.level, key },
        );
    }

    private _baseLevel$$(
        skillOrName: Skill | string,
        charLevel?: number,
        options: { excludeTemporary?: boolean } = {},
    ): Signal<number> {
        const skillName = normalizeSkillName(skillOrName);

        const key = `skill=${ skillName }`
            + `&level=${ charLevel }`;

        return cachedSignal(
            () => {
                const skill$$ = this._commonAdapter.normalizeSkill$$(skillOrName);

                // The innate spell DC gets a special treatment, being replaced with the best other spell DC available.
                const isInnateSpellDC = computed(() => stringEqualsCaseInsensitive(skill$$().name, 'Innate Spell DC'));

                const nonInnateSpellDCLevels$$ = computed(() =>
                    this._creature.customSkills()
                        .filter(creatureSkill =>
                            stringEqualsCaseInsensitive(creatureSkill.type, 'Spell DC')
                            && !stringEqualsCaseInsensitive(creatureSkill.name, 'Innate Spell DC'),
                        )
                        .map(creatureSkill => this.level$$(creatureSkill, charLevel, options)),
                );

                const baseSkillLevelFromIncreases$$ = computed(() =>
                    this._skillLevelFromIncreases$$(skill$$(), charLevel, options),
                );

                const baseSkillLevel$$ = computed(() => {
                    const skill = skill$$();

                    // Determine level from skill increases.
                    let skillLevel = baseSkillLevelFromIncreases$$()();

                    // For your Innate Spell DC,
                    // if your proficiency in any non-innate spell attack rolls or spell DCs is expert or better,
                    // apply the best of these proficiencies to your innate spells, too.
                    if (isInnateSpellDC()) {
                        skillLevel = Math.max(skillLevel, ...nonInnateSpellDCLevels$$().map(level$$ => level$$()));
                    }

                    // Apply any proficiency copy instructions.
                    const proficiencyCopyLevels = this._proficiencyCopySkillLevels$$(skillLevel, skill, charLevel)();

                    return Math.max(skillLevel, ...proficiencyCopyLevels);
                });

                return computed(() =>
                    // Clamp the skill level between untrained and legendary.
                    Math.max(Math.min(baseSkillLevel$$(), SkillLevels.Legendary), SkillLevels.Untrained),
                );
            },
            { store: this._cache.baseLevel, key },
        );
    }

    private _levelEffectTargetList(skill: Skill): Array<string> {
        const list: Array<string> = [`${ skill.name } Proficiency Level`];

        switch (skill.type) {
            case 'Skill':
                list.push('All Skill Proficiency Levels');
                break;
            case 'Save':
                list.push('All Saving Throw Proficiency Levels');
                break;
            case 'Weapon Proficiency':
                list.push('All Weapon Proficiency Levels');
                break;
            case 'Specific Weapon Proficiency':
                list.push('All Weapon Proficiency Levels');
                break;
            case 'Armor Proficiency':
                list.push('All Armor Proficiency Levels');
                break;
            default: break;
        }

        return list;
    }

    private _skillLevelFromIncreases$$(
        skill: Skill,
        charLevel: number | undefined,
        options?: { excludeTemporary?: boolean },
    ): Signal<number> {
        const key = `skill=${ skill.name }`
            + `&charLevel=${ charLevel }`
            + `&options=${ JSON.stringify(options) }`;

        return cachedSignal(
            () => {
                const increases$$ = this._increasesAdapter.skillIncreases$$(
                    {
                        minLevelNumber: 0,
                        maxLevelNumber: charLevel,
                    },
                    {
                        name: skill.name,
                    },
                    { ...options },
                );

                return computed(() =>
                    skillLevelFromIncreases(increases$$()),
                );
            },
            { store: this._cache.skillLevelFromIncreases, key },
        );
    }

    private _proficiencyCopySkillLevels$$(
        skillLevel: number,
        skill: Skill,
        charLevel?: number,
    ): Signal<Array<number>> {
        const key = `skill=${ skill.name }`
            + `&level=${ skillLevel }`
            + `&charLevel=${ charLevel }`;

        return cachedSignal(
            () => {
                const allFeats$$ = this._creature.featsAdapter.featsAtLevel$$(charLevel);

                return computed(() => {
                    const copyProficiencyFeats = allFeats$$()
                        .filter(feat => !!feat.copyProficiency.length);

                    // Collect all the available proficiency copy instructions,
                    // (i.e. "Whenever you gain a class feature that grants you expert or greater proficiency
                    // in a given weapon or weapons, you also gain that proficiency in...").
                    // We check whether you meet the minimum proficiency level for the copy
                    // by comparing your skillLevel up to this point.
                    const proficiencyCopies: Array<ProficiencyCopyGain> =
                        copyProficiencyFeats
                            .map(feat =>
                                feat.copyProficiency
                                    .filter(copy =>
                                        stringEqualsCaseInsensitive(skill.name, copy.name)
                                        && matchNumberFilter({ value: skillLevel, min: copy.minLevel }),
                                    ),
                            ).flat();

                    // If the skill name is "Highest Attack Proficiency",
                    // add an extra proficiency copy instruction that should return the
                    // highest weapon or unarmed procifiency that you have.
                    if (stringEqualsCaseInsensitive(skill.name, 'Highest Attack Proficiency')) {
                        proficiencyCopies.push(
                            ProficiencyCopyGain.from({
                                name: 'Highest Attack Proficiency',
                                type: 'Weapon Proficiency',
                                featuresOnly: false,
                                minLevel: 0,
                            }),
                        );
                    }

                    // For each proficiency copy instruction, collect the matching skill increases.
                    // The increases are grouped by copy, i.e. by type.
                    // For each copy, group them by name so we don't add up increases for different skills.
                    // Then determine the highest level of each skill based on its skill increases,
                    // and return the highest increase per copy.
                    return proficiencyCopies
                        .map(copy => {
                            const increases = this._increasesAdapter.skillIncreases$$(
                                { minLevelNumber: 0, maxLevelNumber: charLevel },
                                {
                                    type: copy.type,
                                    notSources: copy.featuresOnly ? ['Feat:'] : undefined,
                                },
                                { excludeTemporary: true },
                            )();

                            return Math.max(
                                ...Object
                                    .values(
                                        groupArray(increases, increase => increase.name),
                                    )
                                    .map(skillLevelFromIncreases),
                            );
                        });
                });
            },
            { store: this._cache.proficiencyCopySkillLevels, key },
        );
    }
}
