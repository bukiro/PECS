import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';
import { skillLevelBaseStep, SkillLevelMinimumCharacterLevels, SkillLevels } from 'src/libs/shared/definitions/skillLevels';

interface CalculatedSkill {
    level: number;
    ability: string;
    baseValue: { result: number; explain: string; skillLevel: number; ability: string };
    absolutes: Array<Effect>;
    relatives: Array<Effect>;
    bonuses: boolean;
    penalties: boolean;
    value: { result: number; explain: string };
}

interface SkillBaseValue {
    result: number;
    explain: string;
    skillLevel: number;
    ability: string;
}

export class Skill {
    public notes = '';
    public showNotes = false;
    public showEffects = false;
    public $level: Map<string, { value: number; cached: number }> = new Map<string, { value: number; cached: number }>();
    public $ability: Map<string, { value: string; cached: number }> = new Map<string, { value: string; cached: number }>();
    public $baseValue: Map<string, { value: number; cached: number }> = new Map<string, { value: number; cached: number }>();
    public $value: Map<string, { value: number; cached: number }> = new Map<string, { value: number; cached: number }>();
    constructor(
        public ability: string = '',
        public name: string = '',
        public type: string = '',
        //Locked skills don't show up in skill increase choices.
        public locked: boolean = false,
        public recallKnowledge: boolean = false,
    ) { }
    public recast(): Skill {
        if (!(this.$level instanceof Map)) {
            this.$level = new Map<string, { value: number; cached: number }>();
        }

        if (!(this.$ability instanceof Map)) {
            this.$ability = new Map<string, { value: string; cached: number }>();
        }

        if (!(this.$baseValue instanceof Map)) {
            this.$baseValue = new Map<string, { value: number; cached: number }>();
        }

        if (!(this.$value instanceof Map)) {
            this.$value = new Map<string, { value: number; cached: number }>();
        }

        return this;
    }
    public calculate(
        creature: Creature,
        characterService: CharacterService,
        abilitiesService: AbilitiesDataService,
        effectsService: EffectsService,
        charLevel: number = characterService.character().level,
        isDC = false,
    ): CalculatedSkill {
        const level = this.level(creature, characterService, charLevel);
        const ability = this.modifierAbility(creature, characterService);
        const baseValue = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel, level);

        const result = {
            level,
            ability,
            baseValue,
            absolutes: this.absolutes(creature, effectsService, isDC, level, ability),
            relatives: this.relatives(creature, effectsService, isDC, level, ability),
            bonuses: this.showBonuses(creature, effectsService, isDC, level, ability),
            penalties: this.showPenalties(creature, effectsService, isDC, level, ability),
            value: this.value(creature, characterService, abilitiesService, effectsService, charLevel, isDC, baseValue),
        };

        return result;
    }
    public canIncrease(creature: Character, characterService: CharacterService, levelNumber: number, maxRank = 8): boolean {
        if (levelNumber >= SkillLevelMinimumCharacterLevels.Legendary) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(SkillLevels.Legendary, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Master) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(SkillLevels.Master, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Expert) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(SkillLevels.Expert, maxRank));
        } else {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(SkillLevels.Trained, maxRank));
        }
    }
    public isLegal(creature: Character, characterService: CharacterService, levelNumber: number, maxRank = 8): boolean {
        if (levelNumber >= SkillLevelMinimumCharacterLevels.Legendary) {
            return (creature.skillIncreases(characterService, 0, levelNumber, this.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Legendary, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Master) {
            return (creature.skillIncreases(characterService, 0, levelNumber, this.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Master, maxRank));
        } else if (levelNumber >= SkillLevelMinimumCharacterLevels.Expert) {
            return (creature.skillIncreases(characterService, 0, levelNumber, this.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Expert, maxRank));
        } else {
            return (creature.skillIncreases(characterService, 0, levelNumber, this.name).length * skillLevelBaseStep <=
                Math.min(SkillLevels.Trained, maxRank));
        }
    }
    public effectNamesList(creature: Creature, isDC = false, skillLevel = 0, ability = ''): Array<string> {
        const levelNames = ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'];
        const list: Array<string> = [
            this.name,
            'All Checks and DCs',
        ];

        if (ability) {
            list.push(`${ ability }-based Checks and DCs`);

            if (!isDC) {
                list.push(`${ ability }-based Skill Checks`);
            }
        }

        if (this.type === 'Skill') {
            list.push('Skill Checks');
            list.push(`${ levelNames[skillLevel] } Skill Checks`);
        }

        if (this.type === 'Save') { list.push('Saving Throws'); }

        if (this.name.includes('Lore')) { list.push('Lore'); }

        if (this.name.includes('Spell DC') && !isDC) { list.push('Attack Rolls'); list.push('Spell Attack Rolls'); }

        if (this.name.includes('Spell DC') && isDC) { list.push('Spell DCs'); }

        if (this.name.includes('Class DC')) { list.push('Class DCs'); }

        if (this.recallKnowledge) {
            list.push('Recall Knowledge Checks');
            list.push(`${ levelNames[skillLevel] } Recall Knowledge Checks`);
        }

        return list;
    }
    public absolutes(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = ''): Array<Effect> {
        const namesList = this.effectNamesList(creature, isDC, level, ability);

        return effectsService.get_AbsolutesOnThese(creature, namesList);
    }
    public relatives(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = ''): Array<Effect> {
        const namesList = this.effectNamesList(creature, isDC, level, ability);

        return effectsService.get_RelativesOnThese(creature, namesList);
    }
    public showBonuses(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = ''): boolean {
        const namesList = this.effectNamesList(creature, isDC, level, ability);

        return effectsService.show_BonusesOnThese(creature, namesList);
    }
    public showPenalties(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = ''): boolean {
        const namesList = this.effectNamesList(creature, isDC, level, ability);

        return effectsService.show_PenaltiesOnThese(creature, namesList);
    }
    public modifierAbility(creature: Creature, characterService: CharacterService): string {
        if (creature instanceof Familiar) {
            const character = characterService.character();

            // For Familiars, get the correct ability by identifying the non-innate spellcasting
            // with the same class name as the Familiar's originClass and retrieving its key ability.
            return character.class.spellCasting
                .find(spellcasting =>
                    spellcasting.className === creature.originClass &&
                    spellcasting.castingType !== 'Innate',
                ).ability || 'Charisma';
        } else {
            if (this.ability) {
                return this.ability;
            } else {
                const character = characterService.character();
                const cachedAbility = this.$ability.get(`${ creature.type }-${ character.level }`);

                if (cachedAbility) {
                    const checkList = {
                        abilities: [
                            { name: 'Class Key Ability', cached: cachedAbility.cached },
                            { name: `${ this.name.split(' ')[0] } Key Ability`, cached: cachedAbility.cached },
                        ],
                        level: creature instanceof AnimalCompanion ? cachedAbility.cached : 0,
                    };

                    if (!characterService.cacheService.hasChecklistChanged(
                        checkList,
                        { creatureTypeId: creature.typeId, level: character.level, name: `Skill Ability: ${ this.name }` },
                    )) {
                        return cachedAbility.value;
                    }
                }

                // Get the correct ability by finding the first key ability boost for the main class or the archetype class.
                // Some effects ask for your Unarmed Attacks modifier without any weapon, so we need to apply your strength modifier.
                // But Unarmed Attacks is not a real skill and does not have an ability.
                if (this.name === 'Unarmed Attacks') {
                    this.$ability.set(`${ creature.type }-${ character.level }`, { value: 'Strength', cached: Date.now() });

                    return 'Strength';
                }

                if (this.name === `${ character.class.name } Class DC`) {
                    const ability = character.abilityBoosts(1, 1, '', '', 'Class Key Ability')[0]?.name;

                    this.$ability.set(`${ creature.type }-${ character.level }`, { value: ability, cached: Date.now() });

                    return ability;
                } else if (this.name.includes(' Class DC') && !this.name.includes(character.class.name)) {
                    const ability =
                        character.abilityBoosts(1, character.level, '', '', `${ this.name.split(' ')[0] } Key Ability`)[0]?.name;

                    this.$ability.set(`${ creature.type }-${ character.level }`, { value: ability, cached: Date.now() });

                    return ability;
                }
            }
        }

        return '';
    }
    public level(
        creature: Creature,
        characterService: CharacterService,
        charLevel: number = characterService.character().level,
        excludeTemporary = false,
    ): number {
        if (characterService.stillLoading) { return 0; }

        if (creature instanceof Familiar) {
            return ['Perception', 'Acrobatics', 'Stealth'].includes(this.name)
                ? SkillLevels.Trained
                : SkillLevels.Untrained;
        } else {
            const effectsService = characterService.effectsService;
            let skillLevel = SkillLevels.Untrained;
            const relevantSkillList: Array<string> = [this.name];

            if (this.name.includes('Innate') && this.name.includes('Spell DC')) {
                relevantSkillList.push('Any Spell DC');
            }

            const effectTargetList: Array<string> = [`${ this.name } Proficiency Level`];

            switch (this.type) {
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

            const cachedLevel = this.$level.get(`${ creature.type }-${ charLevel }-${ excludeTemporary }`);

            if (cachedLevel) {
                const checkList = {
                    skills: relevantSkillList.map(name => ({ name, cached: cachedLevel.cached })),
                    effects: effectTargetList.map(name => ({ name, cached: cachedLevel.cached })),
                    proficiencyCopies: cachedLevel.cached,
                    level: creature instanceof AnimalCompanion ? cachedLevel.cached : 0,
                };

                if (!characterService.cacheService.hasChecklistChanged(
                    checkList,
                    { creatureTypeId: creature.typeId, level: charLevel, name: `Skill Level: ${ this.name }` },
                )) {
                    //If none of the dependencies have changed, return the cached value.
                    return cachedLevel.value;
                }
            }

            const absoluteEffects = excludeTemporary ? [] : effectsService.get_AbsolutesOnThese(creature, effectTargetList);

            if (absoluteEffects.length) {
                //If the skill is set by an effect, we can skip every other calculation.
                absoluteEffects.forEach(effect => {
                    skillLevel = parseInt(effect.setValue, 10);
                });
            } else {
                let increases =
                    (creature as Character | AnimalCompanion)
                        .skillIncreases(characterService, 0, charLevel, this.name, '', '', undefined, excludeTemporary);

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
                if (this.name.includes('Innate') && this.name.includes('Spell DC')) {
                    const spellDCs =
                        characterService.skills(creature)
                            .filter(skill => skill !== this && skill.name.includes('Spell DC') && !skill.name.includes('Innate'));

                    skillLevel =
                        Math.max(
                            skillLevel,
                            ...spellDCs.map(skill => skill.level(creature, characterService, charLevel, excludeTemporary)),
                        );
                }

                const proficiencyCopies: Array<ProficiencyCopy> = [];

                // Collect all the available proficiency copy instructions,
                // (i.e. "Whenever you gain a class feature that grants you expert or greater proficiency in a given weapon or weapons,
                // you also gain that proficiency in...").
                // We check whether you meet the minimum proficiency level for the copy by comparing your skillLevel up to this point.
                characterService.characterFeatsAndFeatures()
                    .filter(feat => feat.copyProficiency.length && feat.have({ creature }, { characterService }, { charLevel }))
                    .forEach(feat => {
                        proficiencyCopies.push(...feat.copyProficiency.filter(copy =>
                            (this.name.toLowerCase() === copy.name.toLowerCase()) &&
                            (copy.minLevel ? skillLevel >= copy.minLevel : true),
                        ));
                    });

                // If the skill name is "Highest Attack Proficiency",
                // add an extra proficiency copy instruction that should return the highest weapon or unarmed procifiency that you have.
                if (this.name === 'Highest Attack Proficiency') {
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
            const relativeEffects = excludeTemporary ? [] : effectsService.get_RelativesOnThese(creature, effectTargetList);

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
            this.$level.set(`${ creature.type }-${ charLevel }-${ excludeTemporary }`, { value: skillLevel, cached: Date.now() });

            return skillLevel;
        }
    }
    public baseValue(
        creature: Creature,
        characterService: CharacterService,
        abilitiesService: AbilitiesDataService,
        effectsService: EffectsService,
        charLevel: number = characterService.character().level,
        skillLevel: number = this.level((creature as AnimalCompanion | Character), characterService, charLevel),
    ): SkillBaseValue {
        let result = 0;
        let explain = '';
        let ability = '';

        if (!characterService.stillLoading) {
            if (creature instanceof Familiar) {
                //Familiars have special rules:
                //- Saves are equal to the character's before applying circumstance or status effects.
                //- Perception, Acrobatics and Stealth are equal to the character level plus spellcasting modifier (or Charisma).
                //- All others (including attacks) are equal to the character level.
                const character = characterService.character();

                if (['Fortitude', 'Reflex', 'Will'].includes(this.name)) {
                    const charBaseValue = this.baseValue(character, characterService, abilitiesService, effectsService, charLevel);

                    result = charBaseValue.result;
                    explain = charBaseValue.explain;
                } else if (['Perception', 'Acrobatics', 'Stealth'].includes(this.name)) {
                    result = character.level;
                    explain = `Character Level: ${ character.level }`;
                    ability = 'Charisma';
                    ability = this.modifierAbility(creature, characterService);

                    const value = abilitiesService.abilities(ability)[0].mod(character, characterService, effectsService);

                    if (value) {
                        result += value.result;
                        explain += `\nCharacter Spellcasting Ability: ${ value.result }`;
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

                ability = this.modifierAbility(creature, characterService);

                if (ability) {
                    abilityMod =
                        abilitiesService.abilities(ability)[0]
                            .mod((creature as AnimalCompanion | Character), characterService, effectsService).result;
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
    public value(
        creature: Creature,
        characterService: CharacterService,
        abilitiesService: AbilitiesDataService,
        effectsService: EffectsService,
        charLevel: number = characterService.character().level,
        isDC = false,
        baseValue: SkillBaseValue = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel),
    ): { result: number; explain: string } {
        //Calculates the effective bonus of the given Skill
        let result = 0;
        let explain = '';

        if (!characterService.stillLoading) {
            result = baseValue.result;
            explain = baseValue.explain;

            const skillLevel = baseValue.skillLevel;
            const ability = baseValue.ability;
            //Applying assurance prevents any other bonuses, penalties or modifiers.
            let shouldSkipRelativeEffects = false;

            //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
            this.absolutes(creature, effectsService, isDC, skillLevel, ability).forEach(effect => {
                result = parseInt(effect.setValue, 10);
                explain = `${ effect.source }: ${ effect.setValue }`;

                if (effect.source.includes('Assurance')) {
                    shouldSkipRelativeEffects = true;
                }
            });

            const relatives: Array<Effect> = [];

            //Familiars apply the characters skill value (before circumstance and status effects) on saves
            //We get this by calculating the skill's baseValue and adding effects that aren't circumstance or status effects.
            if (creature instanceof Familiar) {
                const character = characterService.character();

                if (['Fortitude', 'Reflex', 'Will'].includes(this.name)) {
                    this.absolutes(character, effectsService, isDC, baseValue.skillLevel, baseValue.ability).forEach(effect => {
                        baseValue.result = parseInt(effect.setValue, 10);
                        baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
                    });
                    relatives.push(
                        ...this.relatives(character, effectsService, isDC, baseValue.skillLevel, baseValue.ability)
                            .filter(effect => effect.type !== 'circumstance' && effect.type !== 'status'),
                    );
                }
            }

            //Get all active relative effects on this and sum them up
            if (!shouldSkipRelativeEffects) {
                relatives.push(...this.relatives(creature, effectsService, isDC, baseValue.skillLevel, baseValue.ability));
                relatives.forEach(effect => {

                    result += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                });
            }
        }

        return { result, explain: explain.trim() };
    }
}
