import { Injectable } from '@angular/core';
import { Observable, switchMap, map, of, combineLatest } from 'rxjs';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect } from 'src/app/classes/effects/effect';
import { Skill } from 'src/app/classes/skills/skill';
import { SkillIncrease } from 'src/app/classes/skills/skill-increase';
import { BonusTypes } from '../../definitions/bonus-types';
import { SkillLevelMinimumCharacterLevels, SkillLevels, skillLevelBaseStep } from '../../definitions/skill-levels';
import { BonusDescription } from '../../ui/bonus-list';
import { addBonusDescriptionFromEffect } from '../../util/bonus-description-uils';
import { signNumber } from '../../util/number-utils';
import { stringEqualsCaseInsensitive } from '../../util/string-utils';
import { AbilityValuesService } from '../ability-values/ability-values.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { CreatureService } from '../creature/creature.service';
import { SkillsDataService } from '../data/skills-data.service';
import { ProficiencyCopyGain } from 'src/app/classes/character-creation/proficiency-copy-gain';

const DCBasis = 10;

export interface SkillLiveValue {
    skillLevel: number;
    ability: string;
    result: number;
    bonuses: Array<BonusDescription>;
    effects: Array<Effect>;
}

export interface SkillBaseValue {
    result: number;
    bonuses: Array<BonusDescription>;
    skillLevel: number;
    ability: string;
}

@Injectable({
    providedIn: 'root',
})
export class SkillValuesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public canIncreaseSkill$(
        skillOrName: Skill | string,
        creature: Character,
        levelNumber: number,
        maxRank = 8,
    ): Observable<boolean> {
        return this._normalizeSkillOrName$(skillOrName, creature)
            .pipe(
                switchMap(skill => this.level$(skill, creature, levelNumber, { excludeTemporary: true })),
                map(currentRank => {
                    if (levelNumber >= SkillLevelMinimumCharacterLevels.Legendary) {
                        return currentRank < Math.min(SkillLevels.Legendary, maxRank);
                    } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Master) {
                        return currentRank < Math.min(SkillLevels.Master, maxRank);
                    } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Expert) {
                        return currentRank < Math.min(SkillLevels.Expert, maxRank);
                    } else {
                        return currentRank < Math.min(SkillLevels.Trained, maxRank);
                    }
                }),
            );
    }

    public isSkillLegal$(
        skillOrName: Skill | string,
        creature: Character,
        levelNumber: number,
        maxRank = 8,
    ): Observable<boolean> {
        return this._normalizeSkillOrName$(skillOrName, creature)
            .pipe(
                map(skill => {
                    const rankByIncreasses = creature.skillIncreases(0, levelNumber, skill.name).length * skillLevelBaseStep;

                    if (levelNumber >= SkillLevelMinimumCharacterLevels.Legendary) {
                        return rankByIncreasses <= Math.min(SkillLevels.Legendary, maxRank);
                    } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Master) {
                        return rankByIncreasses <= Math.min(SkillLevels.Master, maxRank);
                    } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Expert) {
                        return rankByIncreasses <= Math.min(SkillLevels.Expert, maxRank);
                    } else {
                        return rankByIncreasses <= Math.min(SkillLevels.Trained, maxRank);
                    }
                }),
            );
    }

    public level$(
        skillOrName: Skill | string,
        creature: Creature,
        charLevel: number = 0,
        options?: { excludeTemporary?: boolean },
    ): Observable<number> {
        return this._normalizeSkillOrName$(skillOrName, creature)
            .pipe(
                switchMap(skill => {
                    if (creature.isFamiliar()) {
                        return ['Perception', 'Acrobatics', 'Stealth'].includes(skill.name)
                            ? of(SkillLevels.Trained)
                            : of(SkillLevels.Untrained);
                    } else {
                        const effectTargetList: Array<string> = [`${ skill.name } Proficiency Level`];

                        switch (skill.type) {
                            case 'Skill':
                                effectTargetList.push('All Skill Proficiency Levels');
                                break;
                            case 'Save':
                                effectTargetList.push('All Saving Throw Proficiency Levels');
                                break;
                            case 'Weapon Proficiency':
                                effectTargetList.push('All Weapon Proficiency Levels');
                                break;
                            case 'Specific Weapon Proficiency':
                                effectTargetList.push('All Weapon Proficiency Levels');
                                break;
                            case 'Armor Proficiency':
                                effectTargetList.push('All Armor Proficiency Levels');
                                break;
                            default: break;
                        }

                        return combineLatest([
                            options?.excludeTemporary
                                ? of([])
                                : this._creatureEffectsService.absoluteEffectsOnThese$(creature, effectTargetList),
                            options?.excludeTemporary
                                ? of([])
                                : this._creatureEffectsService.relativeEffectsOnThese$(creature, effectTargetList),
                            this._characterFeatsService.characterFeatsAtLevel$(charLevel)
                                .pipe(
                                    map(feats => feats.filter(feat => !!feat.copyProficiency.length)),
                                ),
                            (
                                stringEqualsCaseInsensitive(skill.name, 'Innate', { allowPartialString: true })
                                && stringEqualsCaseInsensitive(skill.name, 'Spell DC', { allowPartialString: true })
                            )
                                ? combineLatest(
                                    this._skillsDataService.skills(creature.customSkills)
                                        .filter(creatureSkill =>
                                            creatureSkill !== skill &&
                                            creatureSkill.name.includes('Spell DC') &&
                                            !creatureSkill.name.includes('Innate'),
                                        )
                                        .map(creatureSkill => this.level$(creatureSkill, creature, charLevel, options)),
                                )
                                : of([]),
                        ])
                            .pipe(
                                map(([absolutes, relatives, copyProficiencyFeats, spellDCLevels]) => {
                                    let skillLevel = SkillLevels.Untrained;
                                    const relevantSkillList: Array<string> = [skill.name];

                                    if (skill.name.includes('Innate') && skill.name.includes('Spell DC')) {
                                        relevantSkillList.push('Any Spell DC');
                                    }

                                    if (absolutes.length) {
                                        //If the skill is set by an effect, we can skip every other calculation.
                                        absolutes.forEach(effect => {
                                            skillLevel = effect.setValueNumerical;
                                        });
                                    } else {
                                        let increases: Array<SkillIncrease> = [];

                                        if (creature.isCharacter()) {
                                            increases =
                                                creature.skillIncreases(
                                                    0,
                                                    charLevel,
                                                    skill.name,
                                                    '',
                                                    '',
                                                    undefined,
                                                    options?.excludeTemporary,
                                                );
                                        }

                                        if (creature.isAnimalCompanion()) {
                                            increases =
                                                creature
                                                    .skillIncreases(0, charLevel, skill.name, '', '', undefined);
                                        }

                                        // Add 2 for each increase, but keep them to their max Rank
                                        increases =
                                            increases
                                                .sort((a, b) =>
                                                    ((a.maxRank || SkillLevels.Legendary) === (b.maxRank || SkillLevels.Legendary))
                                                        ? 0
                                                        : (
                                                            ((a.maxRank || SkillLevels.Legendary) > (b.maxRank || SkillLevels.Legendary))
                                                                ? 1
                                                                : -1
                                                        ),
                                                );
                                        increases.forEach(increase => {
                                            skillLevel =
                                                Math.min(skillLevel + skillLevelBaseStep, (increase.maxRank || SkillLevels.Legendary));
                                        });

                                        // If your proficiency in any non-innate spell attack rolls or spell DCs is expert or better,
                                        // apply the best of these proficiencies to your innate spells, too.
                                        if (
                                            stringEqualsCaseInsensitive(skill.name, 'Innate', { allowPartialString: true })
                                            && stringEqualsCaseInsensitive(skill.name, 'Spell DC', { allowPartialString: true })
                                        ) {
                                            skillLevel =
                                                Math.max(
                                                    skillLevel,
                                                    ...spellDCLevels,
                                                );
                                        }

                                        const proficiencyCopies: Array<ProficiencyCopyGain> = [];

                                        // Collect all the available proficiency copy instructions,
                                        // (i.e. "Whenever you gain a class feature that grants you expert or greater proficiency
                                        // in a given weapon or weapons, you also gain that proficiency in...").
                                        // We check whether you meet the minimum proficiency level for the copy
                                        // by comparing your skillLevel up to this point.
                                        copyProficiencyFeats
                                            .forEach(feat => {
                                                proficiencyCopies.push(...feat.copyProficiency
                                                    .filter(copy =>
                                                        (skill.name.toLowerCase() === copy.name.toLowerCase()) &&
                                                        (copy.minLevel ? skillLevel >= copy.minLevel : true),
                                                    ),
                                                );
                                            });

                                        // If the skill name is "Highest Attack Proficiency",
                                        // add an extra proficiency copy instruction that should return the
                                        // highest weapon or unarmed procifiency that you have.
                                        if (skill.name === 'Highest Attack Proficiency') {
                                            proficiencyCopies.push(
                                                ProficiencyCopyGain.from({
                                                    name: 'Highest Attack Proficiency',
                                                    type: 'Weapon Proficiency',
                                                    featuresOnly: false,
                                                }),
                                            );
                                        }

                                        //For each proficiency copy instruction, collect the desired skill increases, then keep the highest.
                                        const copyLevels: Array<number> = [];

                                        proficiencyCopies.forEach(copy => {
                                            (creature as Character).class.levels
                                                .filter(level => level.number <= creature.level)
                                                .forEach(level => {
                                                    copyLevels.push(...level.skillChoices.filter(choice =>
                                                        //Use .includes so "Specific Weapon Proficiency" matches "Weapon Proficiency".
                                                        stringEqualsCaseInsensitive(choice.type, copy.type, { allowPartialString: true })
                                                        && (copy.featuresOnly ? !choice.source.toLowerCase().includes('feat:') : true),
                                                    ).map(choice => choice.maxRank));
                                                });
                                        });
                                        skillLevel = Math.max(...copyLevels, skillLevel);
                                    }

                                    //Add any relative proficiency level bonuses.
                                    relatives.forEach(effect => {
                                        if ([
                                            -SkillLevels.Legendary,
                                            -SkillLevels.Master,
                                            -SkillLevels.Expert,
                                            -SkillLevels.Trained,
                                            SkillLevels.Trained,
                                            SkillLevels.Expert,
                                            SkillLevels.Master,
                                            SkillLevels.Legendary,
                                        ].includes(effect.valueNumerical)) {
                                            skillLevel += effect.valueNumerical;
                                        }
                                    });
                                    skillLevel = Math.max(Math.min(skillLevel, SkillLevels.Legendary), SkillLevels.Untrained);

                                    return skillLevel;
                                }),
                            );
                    }
                }),
            );
    }

    public baseValue$(
        skillOrName: Skill | string,
        creature: Creature,
        passedCharLevel: number = 0,
        passedSkillLevel?: number,
    ): Observable<SkillBaseValue> {
        return this._normalizeSkillOrName$(skillOrName, creature)
            .pipe(
                switchMap(skill => {
                    if (creature.isFamiliar()) {
                        //Familiars have special rules:
                        //- Saves are equal to the character's before applying circumstance or status effects.
                        //- Perception, Acrobatics and Stealth are equal to the character level plus spellcasting modifier (or Charisma).
                        //- All others (including attacks) are equal to the character level.
                        const character = CreatureService.character;

                        if (stringEqualsCaseInsensitive(skill.type, 'Save')) {
                            return this.baseValue$(skill, character, passedCharLevel);
                        } else if (['Perception', 'Acrobatics', 'Stealth'].includes(skill.name)) {
                            let result = character.level;
                            const bonuses = [{ title: 'Character Level', value: `${ character.level }` }];
                            const ability = this._modifierAbility(skill, creature) ?? 'Charisma';

                            return this._abilityValuesService.mod$(ability, character, passedCharLevel)
                                .pipe(
                                    map(characterAbilityMod => {
                                        if (characterAbilityMod) {
                                            result += characterAbilityMod.result;
                                            bonuses.push({
                                                title: 'Character Spellcasting Ability',
                                                value: signNumber(characterAbilityMod.result),
                                            });
                                        }

                                        return { result, bonuses, ability, skillLevel: 0 };
                                    }),
                                );
                        } else {
                            const result = character.level;
                            const bonuses = [{ title: 'Character Level', value: `${ character.level }` }];

                            return of({ result, bonuses, ability: '', skillLevel: 0 });
                        }
                    }

                    return CharacterFlatteningService.levelOrCurrent$(passedCharLevel)
                        .pipe(
                            switchMap(charLevel =>
                                passedSkillLevel !== undefined
                                    ? of(passedSkillLevel)
                                    : creature.isFamiliar()
                                        ? of(0)
                                        : this.level$(skillOrName, (creature as AnimalCompanion | Character), charLevel),
                            ),
                            map(skillLevel => {
                                // Add character level if the character is trained or better with the Skill.
                                // Add half the level if the skill is unlearned and the character has
                                // the Untrained Improvisation feat(full level from 7 on).
                                // Gets applied to saves and perception, but they are never untrained.
                                let charLevelBonus = 0;

                                const bonuses: Array<BonusDescription> = [];

                                if (skillLevel) {
                                    charLevelBonus = passedCharLevel;
                                    bonuses.push({ title: 'Proficiency Rank', value: `${ skillLevel }` });
                                    bonuses.push({ title: 'Character Level', value: signNumber(charLevelBonus) });
                                }

                                const ability = this._modifierAbility(skill, creature);

                                const result = charLevelBonus + skillLevel;

                                return { result, bonuses, ability, skillLevel };
                            }),
                            switchMap(({ result, bonuses, ability, skillLevel }) =>
                                ability
                                    ? this._abilityValuesService.mod$(ability, creature, passedCharLevel)
                                        .pipe(
                                            map(abilityMod => ({ result, bonuses, ability, skillLevel, abilityMod })),
                                        )
                                    : of({ result, bonuses, ability, skillLevel, abilityMod: undefined }),
                            ),
                            map(({ result, bonuses, ability, skillLevel, abilityMod }) => {
                                if (abilityMod) {
                                    bonuses.push({ title: `${ ability } Modifier `, value: signNumber(abilityMod.result) });
                                    result += abilityMod.result;
                                }

                                return { result, bonuses, ability, skillLevel };
                            }),
                        );
                }),
            );

    }

    /**
     * Calculates the effective bonus of the given Skill right now, with all applied factors.
     */
    public liveValue$(
        skillOrName: Skill | string,
        creature: Creature,
        isDC = false,
    ): Observable<SkillLiveValue> {
        return combineLatest([
            CharacterFlatteningService.levelOrCurrent$(),
            this._normalizeSkillOrName$(skillOrName, creature),
        ])
            .pipe(
                switchMap(([charLevel, skill]) =>
                    this.level$(skill, creature, charLevel)
                        .pipe(
                            switchMap(skillLevel =>
                                this.baseValue$(skill, creature, charLevel, skillLevel)
                                    .pipe(
                                        map(baseValue => ({ skill, skillLevel, baseValue })),
                                    ),

                            ),
                        ),
                ),
                switchMap(({ skill, skillLevel, baseValue }) => {
                    const ability = baseValue.ability;

                    const effectNamesList = this._effectNamesList(skill, isDC, skillLevel, ability);

                    const character = CreatureService.character;
                    const isFamiliarSavingThrow = creature.isFamiliar() && stringEqualsCaseInsensitive(skill.name, 'Save');

                    return combineLatest([
                        this._creatureEffectsService.absoluteEffectsOnThese$(creature, effectNamesList),
                        this._creatureEffectsService.relativeEffectsOnThese$(creature, effectNamesList),
                        // On Saves, Familiars apply the character's skill value before circumstance and status effects.
                        // This means that at this point, the base value is that of the character,
                        // and now we source the remaining types of effects.
                        (isFamiliarSavingThrow)
                            ? this._creatureEffectsService.absoluteEffectsOnThese$(character, effectNamesList)
                            : of([]),
                        (isFamiliarSavingThrow)
                            ? this._creatureEffectsService.relativeEffectsOnThese$(character, effectNamesList)
                                .pipe(
                                    map(characterRelatives => characterRelatives
                                        .filter(effect => ![BonusTypes.Circumstance, BonusTypes.Status].includes(effect.type)),
                                    ),
                                )
                            : of([]),
                    ])
                        .pipe(
                            map(([creatureAbsolutes, creatureRelatives, familiarSaveAbsolutes, familiarSaveRelatives]) => {
                                let result = (isDC ? DCBasis : 0) + baseValue.result;

                                let bonuses = isDC
                                    ? [{ title: 'DC base value', value: '10' }, ...baseValue.bonuses]
                                    : baseValue.bonuses;

                                //Applying assurance prevents any other bonuses, penalties or modifiers.
                                let shouldSkipRelativeEffects = false;

                                //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
                                creatureAbsolutes
                                    .concat(familiarSaveAbsolutes)
                                    .forEach(effect => {
                                        result = effect.setValueNumerical;
                                        bonuses = addBonusDescriptionFromEffect([], effect);

                                        if (effect.source.includes('Assurance')) {
                                            shouldSkipRelativeEffects = true;
                                        }
                                    });

                                //Get all active relative effects on this and sum them up
                                if (!shouldSkipRelativeEffects) {
                                    creatureRelatives
                                        .concat(familiarSaveRelatives)
                                        .forEach(effect => {
                                            result += effect.valueNumerical;
                                            addBonusDescriptionFromEffect(bonuses, effect);
                                        });
                                }

                                const effects = new Array<Effect>()
                                    .concat(creatureAbsolutes)
                                    .concat(familiarSaveAbsolutes)
                                    .concat(shouldSkipRelativeEffects ? [] : creatureRelatives)
                                    .concat(shouldSkipRelativeEffects ? [] : familiarSaveRelatives);

                                return { ability, skillLevel, result, bonuses, effects };
                            }),
                        );
                }),
            );
    }

    private _modifierAbility(skill: Skill, creature: Creature): string {
        if (creature.isFamiliar()) {
            const character = CreatureService.character;

            // For Familiars, get the correct ability by identifying the non-innate spellcasting
            // with the same class name as the Familiar's originClass and retrieving its key ability.
            return character.class.spellCasting
                .find(spellcasting =>
                    spellcasting.className === creature.originClass &&
                    spellcasting.castingType !== 'Innate',
                )?.ability || 'Charisma';
        } else {
            if (skill.ability) {
                return skill.ability;
            } else {
                const character = CreatureService.character;

                // Get the correct ability by finding the first key ability boost for the main class or the archetype class.
                // Some effects ask for your Unarmed Attacks modifier without any weapon, so we need to apply your strength modifier.
                // But Unarmed Attacks is not a real skill and does not have an ability.
                if (skill.name === 'Unarmed Attacks') {
                    return 'Strength';
                }

                if (skill.name === `${ character.class.name } Class DC`) {
                    return character.abilityBoosts(1, 1, '', '', 'Class Key Ability')[0]?.name;
                } else if (skill.name.includes(' Class DC') && !skill.name.includes(character.class.name)) {
                    return character.abilityBoosts(1, character.level, '', '', `${ skill.name.split(' ')[0] } Key Ability`)[0]?.name;
                }
            }
        }

        return '';
    }

    private _effectNamesList(skill: Skill, isDC = false, skillLevel = 0, ability = ''): Array<string> {
        const levelNames = ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'];
        const list: Array<string> = [
            skill.name,
            'All Checks and DCs',
        ];

        if (ability) {
            list.push(`${ ability }-based Checks and DCs`);

            if (!isDC) {
                list.push(`${ ability }-based Skill Checks`);
            }
        }

        if (skill.type === 'Skill') {
            list.push('Skill Checks');
            list.push(`${ levelNames[skillLevel] } Skill Checks`);
        }

        if (skill.type === 'Save') { list.push('Saving Throws'); }

        if (skill.name.includes('Lore')) { list.push('Lore'); }

        if (skill.name.includes('Spell DC') && !isDC) { list.push('Attack Rolls'); list.push('Spell Attack Rolls'); }

        if (skill.name.includes('Spell DC') && isDC) { list.push('Spell DCs'); }

        if (skill.name.includes('Class DC')) { list.push('Class DCs'); }

        if (skill.recallKnowledge) {
            list.push('Recall Knowledge Checks');
            list.push(`${ levelNames[skillLevel] } Recall Knowledge Checks`);
        }

        return list;
    }

    private _normalizeSkillOrName$(skillOrName: Skill | string, creature: Creature): Observable<Skill> {
        if (typeof skillOrName === 'string') {
            return creature.customSkills.values$
                .pipe(
                    map(customSkills => this._skillsDataService.skillFromName(skillOrName, customSkills)),
                );
        } else {
            return of(skillOrName);
        }
    }

}
