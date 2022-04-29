import { AbilitiesService } from 'src/app/services/abilities.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { ProficiencyCopy } from 'src/app/classes/ProficiencyCopy';

export class Skill {
    public notes = '';
    public showNotes = false;
    public showEffects = false;
    public _level: Map<string, { value: number, cached: number }> = new Map<string, { value: number, cached: number }>();
    public _ability: Map<string, { value: string, cached: number }> = new Map<string, { value: string, cached: number }>();
    public _baseValue: Map<string, { value: number, cached: number }> = new Map<string, { value: number, cached: number }>();
    public _value: Map<string, { value: number, cached: number }> = new Map<string, { value: number, cached: number }>();
    constructor(
        public ability: string = '',
        public name: string = '',
        public type: string = '',
        //Locked skills don't show up in skill increase choices.
        public locked: boolean = false,
        public recallKnowledge: boolean = false
    ) { }
    recast() {
        if (!(this._level instanceof Map)) {
            this._level = new Map<string, { value: number, cached: number }>();
        }
        if (!(this._ability instanceof Map)) {
            this._ability = new Map<string, { value: string, cached: number }>();
        }
        if (!(this._baseValue instanceof Map)) {
            this._baseValue = new Map<string, { value: number, cached: number }>();
        }
        if (!(this._value instanceof Map)) {
            this._value = new Map<string, { value: number, cached: number }>();
        }
        return this;
    }
    calculate(creature: Creature, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level, isDC = false) {
        const level: number = (this.level(creature, characterService, charLevel));
        const ability: string = this.get_Ability(creature, characterService);
        const baseValue: { result: number, explain: string, skillLevel: number, ability: string } = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel, level);

        const result = {
            level,
            ability,
            baseValue,
            absolutes: this.absolutes(creature, effectsService, isDC, level, ability) as Effect[],
            relatives: this.relatives(creature, effectsService, isDC, level, ability) as Effect[],
            bonuses: this.bonuses(creature, effectsService, isDC, level, ability) as boolean,
            penalties: this.penalties(creature, effectsService, isDC, level, ability) as boolean,
            value: this.value(creature, characterService, abilitiesService, effectsService, charLevel, isDC, baseValue) as { result: number, explain: string }
        };
        return result;
    }
    canIncrease(creature: Character, characterService: CharacterService, levelNumber: number, maxRank = 8) {
        if (levelNumber >= 15) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(8, maxRank));
        } else if (levelNumber >= 7) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(6, maxRank));
        } else if (levelNumber >= 2) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(4, maxRank));
        } else {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(2, maxRank));
        }
    }
    isLegal(creature: Character, characterService: CharacterService, levelNumber: number, maxRank = 8) {
        if (levelNumber >= 15) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(8, maxRank));
        } else if (levelNumber >= 7) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(6, maxRank));
        } else if (levelNumber >= 2) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(4, maxRank));
        } else {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(2, maxRank));
        }
    }
    get_NamesList(creature: Creature, isDC = false, skillLevel = 0, ability = '') {
        const levelNames = ['Untrained', 'Untrained', 'Trained', 'Trained', 'Expert', 'Expert', 'Master', 'Master', 'Legendary'];
        const list: string[] = [
            this.name,
            'All Checks and DCs',
        ];
        if (ability) {
            list.push(`${ ability }-based Checks and DCs`);
            if (!isDC) {
                list.push(`${ ability }-based Skill Checks`);
            }
        }
        if (this.type == 'Skill') {
            list.push('Skill Checks');
            list.push(`${ levelNames[skillLevel] } Skill Checks`);
        }
        if (this.type == 'Save') { list.push('Saving Throws'); }
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
    absolutes(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = '') {
        const namesList = this.get_NamesList(creature, isDC, level, ability);
        return effectsService.get_AbsolutesOnThese(creature, namesList);
    }
    relatives(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = '') {
        const namesList = this.get_NamesList(creature, isDC, level, ability);
        return effectsService.get_RelativesOnThese(creature, namesList);
    }
    bonuses(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = '') {
        const namesList = this.get_NamesList(creature, isDC, level, ability);
        return effectsService.show_BonusesOnThese(creature, namesList);
    }
    penalties(creature: Creature, effectsService: EffectsService, isDC = false, level = 0, ability = '') {
        const namesList = this.get_NamesList(creature, isDC, level, ability);
        return effectsService.show_PenaltiesOnThese(creature, namesList);
    }
    get_Ability(creature: Creature, characterService: CharacterService) {
        if (creature instanceof Familiar) {
            const character = characterService.get_Character();
            //Get the correct ability by identifying the non-innate spellcasting with the same class name as the Familiar's originClass and retrieving its key ability.
            return character.class.spellCasting.find(spellcasting => spellcasting.className == creature.originClass && spellcasting.castingType != 'Innate').ability || 'Charisma';
        } else {
            if (this.ability) {
                return this.ability;
            } else {
                const character = characterService.get_Character();
                const cachedAbility = this._ability.get(`${ creature.type }-${ character.level }`);
                if (cachedAbility) {
                    const checkList = {
                        abilities: [
                            { name: 'Class Key Ability', cached: cachedAbility.cached },
                            { name: `${ this.name.split(' ')[0] } Key Ability`, cached: cachedAbility.cached }
                        ],
                        level: creature instanceof AnimalCompanion ? cachedAbility.cached : 0
                    };
                    if (!characterService.cacheService.get_HasChanged(checkList, { creatureTypeId: creature.typeId, level: character.level, name: `Skill Ability: ${ this.name }` })) {
                        return cachedAbility.value;
                    }
                }
                //Get the correct ability by finding the first key ability boost for the main class or the archetype class.
                // Some effects ask for your Unarmed Attacks modifier without any weapon, so we need to apply your strength modifier. But Unarmed Attacks is not a real skill and does not have an ability.
                if (this.name == 'Unarmed Attacks') {
                    this._ability.set(`${ creature.type }-${ character.level }`, { value: 'Strength', cached: Date.now() });
                    return 'Strength';
                }
                if (this.name == `${ character.class.name } Class DC`) {
                    const ability = character.get_AbilityBoosts(1, 1, '', '', 'Class Key Ability')[0]?.name;
                    this._ability.set(`${ creature.type }-${ character.level }`, { value: ability, cached: Date.now() });
                    return ability;
                } else if (this.name.includes(' Class DC') && !this.name.includes(character.class.name)) {
                    const ability = character.get_AbilityBoosts(1, character.level, '', '', `${ this.name.split(' ')[0] } Key Ability`)[0]?.name;
                    this._ability.set(`${ creature.type }-${ character.level }`, { value: ability, cached: Date.now() });
                    return ability;
                }
            }
        }
        return '';
    }
    level(creature: Creature, characterService: CharacterService, charLevel: number = characterService.get_Character().level, excludeTemporary = false) {
        if (characterService.still_loading()) { return 0; }
        if (creature instanceof Familiar) {
            return ['Perception', 'Acrobatics', 'Stealth'].includes(this.name) ? 2 : 0;
        } else {
            const effectsService = characterService.effectsService;
            let skillLevel = 0;
            const relevantSkillList: string[] = [this.name];
            if (this.name.includes('Innate') && this.name.includes('Spell DC')) {
                relevantSkillList.push('Any Spell DC');
            }
            const effectTargetList: string[] = [`${ this.name } Proficiency Level`];
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
            }
            const cachedLevel = this._level.get(`${ creature.type }-${ charLevel }-${ excludeTemporary }`);
            if (cachedLevel) {
                const checkList = {
                    skills: relevantSkillList.map(name => {
                        return { name, cached: cachedLevel.cached };
                    }),
                    effects: effectTargetList.map(name => {
                        return { name, cached: cachedLevel.cached };
                    }),
                    proficiencyCopies: cachedLevel.cached,
                    level: creature instanceof AnimalCompanion ? cachedLevel.cached : 0
                };
                if (!characterService.cacheService.get_HasChanged(checkList, { creatureTypeId: creature.typeId, level: charLevel, name: `Skill Level: ${ this.name }` })) {
                    //If none of the dependencies have changed, return the cached value.
                    return cachedLevel.value;
                }
            }
            const absoluteEffects = excludeTemporary ? [] : effectsService.get_AbsolutesOnThese(creature, effectTargetList);
            if (absoluteEffects.length) {
                //If the skill is set by an effect, we can skip every other calculation.
                absoluteEffects.forEach(effect => {
                    skillLevel = parseInt(effect.setValue);
                });
            } else {
                let increases = (creature as Character | AnimalCompanion).get_SkillIncreases(characterService, 0, charLevel, this.name, '', '', undefined, excludeTemporary);
                // Add 2 for each increase, but keep them to their max Rank
                increases = increases.sort((a, b) => ((a.maxRank || 8) == (b.maxRank || 8)) ? 0 : (((a.maxRank || 8) > (b.maxRank || 8)) ? 1 : -1));
                increases.forEach(increase => {
                    skillLevel = Math.min(skillLevel + 2, (increase.maxRank || 8));
                });
                //If your proficiency in any non-innate spell attack rolls or spell DCs is expert or better, apply the best of these proficiencies to your innate spells, too.
                if (this.name.includes('Innate') && this.name.includes('Spell DC')) {
                    const spellDCs = characterService.get_Skills(creature).filter(skill => skill !== this && skill.name.includes('Spell DC') && !skill.name.includes('Innate'));
                    skillLevel = Math.max(skillLevel, ...spellDCs.map(skill => skill.level(creature, characterService, charLevel, excludeTemporary)));
                }
                const proficiencyCopies: ProficiencyCopy[] = [];
                //Collect all the available proficiency copy instructions,
                // (i.e. "Whenever you gain a class feature that grants you expert or greater proficiency in a given weapon or weapons, you also gain that proficiency in...").
                //We check whether you meet the minimum proficiency level for the copy by comparing your skillLevel up to this point.
                characterService.get_CharacterFeatsAndFeatures()
                    .filter(feat => feat.copyProficiency.length && feat.have({ creature }, { characterService }, { charLevel }))
                    .forEach(feat => {
                        proficiencyCopies.push(...feat.copyProficiency.filter(copy =>
                            (this.name.toLowerCase() == copy.name.toLowerCase()) &&
                            (copy.minLevel ? skillLevel >= copy.minLevel : true)
                        ));
                    });
                //If the skill name is "Highest Attack Proficiency", add an extra proficiency copy instruction that should return the highest weapon or unarmed procifiency that you have.
                if (this.name == 'Highest Attack Proficiency') {
                    proficiencyCopies.push(Object.assign(new ProficiencyCopy(), { name: 'Highest Attack Proficiency', type: 'Weapon Proficiency', featuresOnly: false }));
                }
                //For each proficiency copy instruction, collect the desired skill increases, then keep the highest.
                const copyLevels: number[] = [];
                proficiencyCopies.forEach(copy => {
                    (creature as Character).class.levels.filter(level => level.number <= creature.level).forEach(level => {
                        copyLevels.push(
                            ...level.skillChoices.filter(choice =>
                                //Use .includes so "Specific Weapon Proficiency" matches "Weapon Proficiency".
                                (choice.type.toLowerCase().includes(copy.type.toLowerCase())) &&
                                (copy.featuresOnly ? !choice.source.toLowerCase().includes('feat:') : true)
                            ).map(choice => choice.maxRank));
                    });
                });
                skillLevel = Math.max(...copyLevels, skillLevel);
            }
            //Add any relative proficiency level bonuses.
            const relativeEffects = excludeTemporary ? [] : effectsService.get_RelativesOnThese(creature, effectTargetList);
            relativeEffects.forEach(effect => {
                if ([-8, -6, -4, -2, 2, 4, 6, 8].includes(parseInt(effect.value))) {
                    skillLevel += parseInt(effect.value);
                }
            });
            skillLevel = Math.max(Math.min(skillLevel, 8), 0);
            this._level.set(`${ creature.type }-${ charLevel }-${ excludeTemporary }`, { value: skillLevel, cached: Date.now() });
            return skillLevel;
        }
    }
    baseValue(creature: Creature, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level, skillLevel: number = undefined) {
        let result = 0;
        let explain = '';
        let ability = '';
        if (!characterService.still_loading()) {
            if (creature instanceof Familiar) {
                //Familiars have special rules:
                //- Saves are equal to the character's before applying circumstance or status effects.
                //- Perception, Acrobatics and Stealth are equal to the character level plus spellcasting modifier (or Charisma).
                //- All others (including attacks) are equal to the character level.
                const character = characterService.get_Character();
                if (['Fortitude', 'Reflex', 'Will'].includes(this.name)) {
                    const charBaseValue = this.baseValue(character, characterService, abilitiesService, effectsService, charLevel);
                    result = charBaseValue.result;
                    explain = charBaseValue.explain;
                } else if (['Perception', 'Acrobatics', 'Stealth'].includes(this.name)) {
                    result = character.level;
                    explain = `Character Level: ${ character.level }`;
                    ability = 'Charisma';
                    //Get the correct ability by identifying the non-innate spellcasting with the same class name as the Familiar's originClass and retrieving its key ability.
                    ability = this.get_Ability(creature, characterService);
                    const value = abilitiesService.get_Abilities(ability)[0].mod(character, characterService, effectsService);
                    if (value) {
                        result += value.result;
                        explain += `\nCharacter Spellcasting Ability: ${ value.result }`;
                    }
                } else {
                    result = character.level;
                    explain = `Character Level: ${ character.level }`;
                }
            } else {
                //Add character level if the character is trained or better with the Skill
                //Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat (full level from 7 on).
                //Gets applied to saves and perception, but they are never untrained
                if (skillLevel == undefined) {
                    skillLevel = this.level((creature as AnimalCompanion | Character), characterService, charLevel);
                }
                let charLevelBonus = 0;
                if (skillLevel) {
                    charLevelBonus = charLevel;
                    explain += `\nProficiency Rank: ${ skillLevel }`;
                    explain += `\nCharacter Level: ${ charLevelBonus }`;
                }
                //Add the Ability modifier identified by the skill's ability property
                let abilityMod = 0;
                ability = this.get_Ability(creature, characterService);
                if (ability) {
                    abilityMod = abilitiesService.get_Abilities(ability)[0].mod((creature as AnimalCompanion | Character), characterService, effectsService).result;
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
    value(creature: Creature, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level, isDC = false, baseValue: { result: number, explain: string, skillLevel: number, ability: string } = undefined) {
        //Calculates the effective bonus of the given Skill
        let result = 0;
        let explain = '';
        if (!characterService.still_loading()) {
            if (baseValue == undefined) {
                baseValue = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel);
            }
            result = baseValue.result;
            explain = baseValue.explain;
            const skillLevel = baseValue.skillLevel;
            const ability = baseValue.ability;
            //Applying assurance prevents any other bonuses, penalties or modifiers.
            let noRelatives = false;
            //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
            this.absolutes(creature, effectsService, isDC, skillLevel, ability).forEach(effect => {
                result = parseInt(effect.setValue);
                explain = `${ effect.source }: ${ effect.setValue }`;
                if (effect.source.includes('Assurance')) {
                    noRelatives = true;
                }
            });
            const relatives: Effect[] = [];
            //Familiars apply the characters skill value (before circumstance and status effects) on saves
            //We get this by calculating the skill's baseValue and adding effects that aren't circumstance or status effects.
            if (creature instanceof Familiar) {
                const character = characterService.get_Character();
                if (['Fortitude', 'Reflex', 'Will'].includes(this.name)) {
                    if (baseValue == undefined) {
                        baseValue = this.baseValue(character, characterService, abilitiesService, effectsService, charLevel);
                    }
                    this.absolutes(character, effectsService, isDC, baseValue.skillLevel, baseValue.ability).forEach(effect => {
                        baseValue.result = parseInt(effect.setValue);
                        baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
                    });
                    relatives.push(...this.relatives(character, effectsService, isDC, baseValue.skillLevel, baseValue.ability).filter(effect => effect.type != 'circumstance' && effect.type != 'status'));
                }
            }
            //Get all active relative effects on this and sum them up
            if (!noRelatives) {
                relatives.push(...this.relatives(creature, effectsService, isDC, baseValue.skillLevel, baseValue.ability));
                relatives.forEach(effect => {

                    result += parseInt(effect.value);
                    explain += `\n${ effect.source }: ${ effect.value }`;
                });
            }
        }
        return { result, explain: explain.trim() };
    }
}
