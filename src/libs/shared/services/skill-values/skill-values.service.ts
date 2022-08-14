/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';
import { Skill } from 'src/app/classes/Skill';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { CacheService } from 'src/app/services/cache.service';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { SkillLevelMinimumCharacterLevels, SkillLevels, skillLevelBaseStep } from 'src/libs/shared/definitions/skillLevels';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';

export interface CalculatedSkill {
    level: number;
    ability: string;
    baseValue: { result: number; explain: string; skillLevel: number; ability: string };
    absolutes: Array<Effect>;
    relatives: Array<Effect>;
    bonuses: boolean;
    penalties: boolean;
    value: { result: number; explain: string };
}

export interface SkillBaseValue {
    result: number;
    explain: string;
    skillLevel: number;
    ability: string;
}

@Injectable({
    providedIn: 'root',
})
export class SkillValuesService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _cacheService: CacheService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _creatureFeatsService: CreatureFeatsService,
    ) { }

    public calculate(
        skillOrName: Skill | string,
        creature: Creature,
        charLevel: number = this._characterService.character.level,
        isDC = false,
    ): CalculatedSkill {
        const skill = this._normalizeSkillOrName(skillOrName, creature);

        const level = this.level(skill, creature, charLevel);
        const ability = this._modifierAbility(skill, creature);
        const baseValue = this.baseValue(skill, creature, charLevel, level);

        const result = {
            level,
            ability,
            baseValue,
            absolutes: this._absolutes(skill, creature, isDC, level, ability),
            relatives: this._relatives(skill, creature, isDC, level, ability),
            bonuses: this._showBonuses(skill, creature, isDC, level, ability),
            penalties: this._showPenalties(skill, creature, isDC, level, ability),
            value: this._value(skill, creature, charLevel, isDC, baseValue),
        };

        return result;
    }

    public canIncreaseSkill(
        skillOrName: Skill | string,
        creature: Character,
        levelNumber: number,
        maxRank = 8,
    ): boolean {
        const skill = this._normalizeSkillOrName(skillOrName, creature);

        if (levelNumber >= SkillLevelMinimumCharacterLevels.Legendary) {
            return (this.level(skill, creature, levelNumber, true) < Math.min(SkillLevels.Legendary, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Master) {
            return (this.level(skill, creature, levelNumber, true) < Math.min(SkillLevels.Master, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Expert) {
            return (this.level(skill, creature, levelNumber, true) < Math.min(SkillLevels.Expert, maxRank));
        } else {
            return (this.level(skill, creature, levelNumber, true) < Math.min(SkillLevels.Trained, maxRank));
        }
    }

    public isSkillLegal(
        skillOrName: Skill | string,
        creature: Character,
        levelNumber: number,
        maxRank = 8,
    ): boolean {
        const skill = this._normalizeSkillOrName(skillOrName, creature);

        if (levelNumber >= SkillLevelMinimumCharacterLevels.Legendary) {
            return (creature.skillIncreases(0, levelNumber, skill.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Legendary, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Master) {
            return (creature.skillIncreases(0, levelNumber, skill.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Master, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Expert) {
            return (creature.skillIncreases(0, levelNumber, skill.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Expert, maxRank));
        } else {
            return (creature.skillIncreases(0, levelNumber, skill.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Trained, maxRank));
        }
    }

    public level(
        skillOrName: Skill | string,
        creature: Creature,
        charLevel: number = this._characterService.character.level,
        excludeTemporary = false,
    ): number {
        if (this._characterService.stillLoading) { return 0; }

        const skill = this._normalizeSkillOrName(skillOrName, creature);

        if (creature.isFamiliar()) {
            return ['Perception', 'Acrobatics', 'Stealth'].includes(skill.name)
                ? SkillLevels.Trained
                : SkillLevels.Untrained;
        } else {
            let skillLevel = SkillLevels.Untrained;
            const relevantSkillList: Array<string> = [skill.name];

            if (skill.name.includes('Innate') && skill.name.includes('Spell DC')) {
                relevantSkillList.push('Any Spell DC');
            }

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

            const cachedLevel = skill.$level.get(`${ creature.type }-${ charLevel }-${ excludeTemporary }`);

            if (cachedLevel) {
                const checkList = {
                    skills: relevantSkillList.map(name => ({ name, cached: cachedLevel.cached })),
                    effects: effectTargetList.map(name => ({ name, cached: cachedLevel.cached })),
                    proficiencyCopies: cachedLevel.cached,
                    level: creature.isAnimalCompanion() ? cachedLevel.cached : 0,
                };

                if (!this._cacheService.hasChecklistChanged(
                    checkList,
                    { creatureTypeId: creature.typeId, level: charLevel, name: `Skill Level: ${ skill.name }` },
                )) {
                    //If none of the dependencies have changed, return the cached value.
                    return cachedLevel.value;
                }
            }

            const absoluteEffects = excludeTemporary ? [] : this._effectsService.absoluteEffectsOnThese(creature, effectTargetList);

            if (absoluteEffects.length) {
                //If the skill is set by an effect, we can skip every other calculation.
                absoluteEffects.forEach(effect => {
                    skillLevel = parseInt(effect.setValue, 10);
                });
            } else {
                let increases: Array<SkillIncrease> = [];

                if (creature.isCharacter()) {
                    increases =
                        creature.skillIncreases(0, charLevel, skill.name, '', '', undefined, excludeTemporary);
                }

                if (creature.isAnimalCompanion()) {
                    increases =
                        creature
                            .skillIncreases(0, charLevel, skill.name, '', '', undefined);
                }

                // Add 2 for each increase, but keep them to their max Rank
                increases =
                    increases.sort((a, b) => ((a.maxRank || SkillLevels.Legendary) === (b.maxRank || SkillLevels.Legendary))
                        ? 0
                        : (((a.maxRank || SkillLevels.Legendary) > (b.maxRank || SkillLevels.Legendary)) ? 1 : -1));
                increases.forEach(increase => {
                    skillLevel = Math.min(skillLevel + skillLevelBaseStep, (increase.maxRank || SkillLevels.Legendary));
                });

                // If your proficiency in any non-innate spell attack rolls or spell DCs is expert or better,
                // apply the best of these proficiencies to your innate spells, too.
                if (skill.name.includes('Innate') && skill.name.includes('Spell DC')) {
                    const spellDCs =
                        this._characterService.skills(creature)
                            .filter(creatureSkill =>
                                creatureSkill !== skill &&
                                creatureSkill.name.includes('Spell DC') &&
                                !creatureSkill.name.includes('Innate'),
                            );

                    skillLevel =
                        Math.max(
                            skillLevel,
                            ...spellDCs.map(creatureSkill => this.level(creatureSkill, creature, charLevel, excludeTemporary)),
                        );
                }

                const proficiencyCopies: Array<ProficiencyCopy> = [];

                // Collect all the available proficiency copy instructions,
                // (i.e. "Whenever you gain a class feature that grants you expert or greater proficiency in a given weapon or weapons,
                // you also gain that proficiency in...").
                // We check whether you meet the minimum proficiency level for the copy by comparing your skillLevel up to this point.
                this._characterService.characterFeatsAndFeatures()
                    .filter(feat =>
                        feat.copyProficiency.length &&
                        this._creatureFeatsService.creatureHasFeat(feat, { creature }, { charLevel }),
                    )
                    .forEach(feat => {
                        proficiencyCopies.push(...feat.copyProficiency.filter(copy =>
                            (skill.name.toLowerCase() === copy.name.toLowerCase()) &&
                            (copy.minLevel ? skillLevel >= copy.minLevel : true),
                        ));
                    });

                // If the skill name is "Highest Attack Proficiency",
                // add an extra proficiency copy instruction that should return the highest weapon or unarmed procifiency that you have.
                if (skill.name === 'Highest Attack Proficiency') {
                    proficiencyCopies.push(
                        Object.assign(
                            new ProficiencyCopy(),
                            { name: 'Highest Attack Proficiency', type: 'Weapon Proficiency', featuresOnly: false },
                        ),
                    );
                }

                //For each proficiency copy instruction, collect the desired skill increases, then keep the highest.
                const copyLevels: Array<number> = [];

                proficiencyCopies.forEach(copy => {
                    (creature as Character).class.levels.filter(level => level.number <= creature.level).forEach(level => {
                        copyLevels.push(
                            ...level.skillChoices.filter(choice =>
                                //Use .includes so "Specific Weapon Proficiency" matches "Weapon Proficiency".
                                (choice.type.toLowerCase().includes(copy.type.toLowerCase())) &&
                                (copy.featuresOnly ? !choice.source.toLowerCase().includes('feat:') : true),
                            ).map(choice => choice.maxRank));
                    });
                });
                skillLevel = Math.max(...copyLevels, skillLevel);
            }

            //Add any relative proficiency level bonuses.
            const relativeEffects = excludeTemporary ? [] : this._effectsService.relativeEffectsOnThese(creature, effectTargetList);

            relativeEffects.forEach(effect => {
                if ([
                    -SkillLevels.Legendary,
                    -SkillLevels.Master,
                    -SkillLevels.Expert,
                    -SkillLevels.Trained,
                    SkillLevels.Trained,
                    SkillLevels.Expert,
                    SkillLevels.Master,
                    SkillLevels.Legendary,
                ].includes(parseInt(effect.value, 10))) {
                    skillLevel += parseInt(effect.value, 10);
                }
            });
            skillLevel = Math.max(Math.min(skillLevel, SkillLevels.Legendary), SkillLevels.Untrained);
            skill.$level.set(`${ creature.type }-${ charLevel }-${ excludeTemporary }`, { value: skillLevel, cached: Date.now() });

            return skillLevel;
        }
    }
    public baseValue(
        skillOrName: Skill | string,
        creature: Creature,
        charLevel: number = this._characterService.character.level,
        skillLevel: number = this.level(skillOrName, (creature as AnimalCompanion | Character), charLevel),
    ): SkillBaseValue {
        const skill = this._normalizeSkillOrName(skillOrName, creature);

        let result = 0;
        let explain = '';
        let ability = '';

        if (!this._characterService.stillLoading) {
            if (creature.isFamiliar()) {
                //Familiars have special rules:
                //- Saves are equal to the character's before applying circumstance or status effects.
                //- Perception, Acrobatics and Stealth are equal to the character level plus spellcasting modifier (or Charisma).
                //- All others (including attacks) are equal to the character level.
                const character = this._characterService.character;

                if (['Fortitude', 'Reflex', 'Will'].includes(skill.name)) {
                    const charBaseValue = this.baseValue(skill, character, charLevel);

                    result = charBaseValue.result;
                    explain = charBaseValue.explain;
                } else if (['Perception', 'Acrobatics', 'Stealth'].includes(skill.name)) {
                    result = character.level;
                    explain = `Character Level: ${ character.level }`;
                    ability = 'Charisma';
                    ability = this._modifierAbility(skill, creature);

                    const abilityMod = this._abilityValuesService.mod(ability, creature, charLevel);

                    if (abilityMod) {
                        result += abilityMod.result;
                        explain += `\nCharacter Spellcasting Ability: ${ abilityMod.result }`;
                    }
                } else {
                    result = character.level;
                    explain = `Character Level: ${ character.level }`;
                }
            } else {
                // Add character level if the character is trained or better with the Skill.
                // Add half the level if the skill is unlearned and the character has
                // the Untrained Improvisation feat(full level from 7 on).
                // Gets applied to saves and perception, but they are never untrained.
                let charLevelBonus = 0;

                if (skillLevel) {
                    charLevelBonus = charLevel;
                    explain += `\nProficiency Rank: ${ skillLevel }`;
                    explain += `\nCharacter Level: ${ charLevelBonus }`;
                }

                //Add the Ability modifier identified by the skill's ability property
                let abilityMod = 0;

                ability = this._modifierAbility(skill, creature);

                if (ability) {
                    abilityMod = this._abilityValuesService.mod(ability, creature, charLevel).result;
                }

                if (abilityMod) {
                    explain += `\n${ ability } Modifier: ${ abilityMod }`;
                }

                explain = explain.trim();
                //Add up all modifiers, the skill proficiency and all active effects and return the sum
                result = charLevelBonus + skillLevel + abilityMod;
            }
        }

        return { result, explain, skillLevel, ability };
    }

    private _absolutes(skill: Skill, creature: Creature, isDC = false, level = 0, ability = ''): Array<Effect> {
        const namesList = this._effectNamesList(skill, creature, isDC, level, ability);

        return this._effectsService.absoluteEffectsOnThese(creature, namesList);
    }

    private _relatives(skill: Skill, creature: Creature, isDC = false, level = 0, ability = ''): Array<Effect> {
        const namesList = this._effectNamesList(skill, creature, isDC, level, ability);

        return this._effectsService.relativeEffectsOnThese(creature, namesList);
    }

    private _showBonuses(skill: Skill, creature: Creature, isDC = false, level = 0, ability = ''): boolean {
        const namesList = this._effectNamesList(skill, creature, isDC, level, ability);

        return this._effectsService.doBonusEffectsExistOnThese(creature, namesList);
    }

    private _showPenalties(skill: Skill, creature: Creature, isDC = false, level = 0, ability = ''): boolean {
        const namesList = this._effectNamesList(skill, creature, isDC, level, ability);

        return this._effectsService.doPenaltyEffectsExistOnThese(creature, namesList);
    }

    private _modifierAbility(skill: Skill, creature: Creature): string {
        if (creature.isFamiliar()) {
            const character = this._characterService.character;

            // For Familiars, get the correct ability by identifying the non-innate spellcasting
            // with the same class name as the Familiar's originClass and retrieving its key ability.
            return character.class.spellCasting
                .find(spellcasting =>
                    spellcasting.className === creature.originClass &&
                    spellcasting.castingType !== 'Innate',
                ).ability || 'Charisma';
        } else {
            if (skill.ability) {
                return skill.ability;
            } else {
                const character = this._characterService.character;
                const cachedAbility = skill.$ability.get(`${ creature.type }-${ character.level }`);

                if (cachedAbility) {
                    const checkList = {
                        abilities: [
                            { name: 'Class Key Ability', cached: cachedAbility.cached },
                            { name: `${ skill.name.split(' ')[0] } Key Ability`, cached: cachedAbility.cached },
                        ],
                        level: creature.isAnimalCompanion() ? cachedAbility.cached : 0,
                    };

                    if (!this._cacheService.hasChecklistChanged(
                        checkList,
                        { creatureTypeId: creature.typeId, level: character.level, name: `Skill Ability: ${ skill.name }` },
                    )) {
                        return cachedAbility.value;
                    }
                }

                // Get the correct ability by finding the first key ability boost for the main class or the archetype class.
                // Some effects ask for your Unarmed Attacks modifier without any weapon, so we need to apply your strength modifier.
                // But Unarmed Attacks is not a real skill and does not have an ability.
                if (skill.name === 'Unarmed Attacks') {
                    skill.$ability.set(`${ creature.type }-${ character.level }`, { value: 'Strength', cached: Date.now() });

                    return 'Strength';
                }

                if (skill.name === `${ character.class.name } Class DC`) {
                    const ability = character.abilityBoosts(1, 1, '', '', 'Class Key Ability')[0]?.name;

                    skill.$ability.set(`${ creature.type }-${ character.level }`, { value: ability, cached: Date.now() });

                    return ability;
                } else if (skill.name.includes(' Class DC') && !skill.name.includes(character.class.name)) {
                    const ability =
                        character.abilityBoosts(1, character.level, '', '', `${ skill.name.split(' ')[0] } Key Ability`)[0]?.name;

                    skill.$ability.set(`${ creature.type }-${ character.level }`, { value: ability, cached: Date.now() });

                    return ability;
                }
            }
        }

        return '';
    }

    private _effectNamesList(skill: Skill, creature: Creature, isDC = false, skillLevel = 0, ability = ''): Array<string> {
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

    /**
     * Calculates the effective bonus of the given Skill
     */
    private _value(
        skill: Skill,
        creature: Creature,
        charLevel: number = this._characterService.character.level,
        isDC = false,
        baseValue: SkillBaseValue = this.baseValue(skill, creature, charLevel),
    ): { result: number; explain: string } {
        let result = 0;
        let explain = '';

        if (!this._characterService.stillLoading) {
            result = baseValue.result;
            explain = baseValue.explain;

            const skillLevel = baseValue.skillLevel;
            const ability = baseValue.ability;
            //Applying assurance prevents any other bonuses, penalties or modifiers.
            let shouldSkipRelativeEffects = false;

            //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
            this._absolutes(skill, creature, isDC, skillLevel, ability).forEach(effect => {
                result = parseInt(effect.setValue, 10);
                explain = `${ effect.source }: ${ effect.setValue }`;

                if (effect.source.includes('Assurance')) {
                    shouldSkipRelativeEffects = true;
                }
            });

            const relatives: Array<Effect> = [];

            //Familiars apply the characters skill value (before circumstance and status effects) on saves
            //We get this by calculating the skill's baseValue and adding effects that aren't circumstance or status effects.
            if (creature.isFamiliar()) {
                const character = this._characterService.character;

                if (['Fortitude', 'Reflex', 'Will'].includes(skill.name)) {
                    this._absolutes(skill, character, isDC, baseValue.skillLevel, baseValue.ability)
                        .forEach(effect => {
                            baseValue.result = parseInt(effect.setValue, 10);
                            baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
                        });
                    relatives
                        .push(
                            ...this._relatives(skill, character, isDC, baseValue.skillLevel, baseValue.ability)
                                .filter(effect => effect.type !== 'circumstance' && effect.type !== 'status'),
                        );
                }
            }

            //Get all active relative effects on this and sum them up
            if (!shouldSkipRelativeEffects) {
                relatives.push(...this._relatives(skill, creature, isDC, baseValue.skillLevel, baseValue.ability));
                relatives.forEach(effect => {

                    result += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                });
            }
        }

        return { result, explain: explain.trim() };
    }

    private _normalizeSkillOrName(skillOrName: Skill | string, creature: Creature): Skill | undefined {
        if (typeof skillOrName === 'string') {
            return this._skillsDataService.skills(creature.customSkills, skillOrName)[0];
        } else {
            return skillOrName;
        }
    }

}
