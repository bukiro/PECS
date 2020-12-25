import { AbilitiesService } from './abilities.service';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';
import { ThrowStmt } from '@angular/compiler';
import { Creature } from './Creature';
import { ProficiencyCopy } from './ProficiencyCopy';

export class Skill {
    public readonly _className: string = this.constructor.name;
    public $ability: string[] = ["","",""];
    public $baseValue: { result: number, explain: string }[] = [{ result: 0, explain: "" }, { result: 0, explain: "" }, { result: 0, explain: "" }];
    public $bonuses: (boolean)[] = [false, false, false];
    public $absolutes: (Effect[])[] = [[], [], []];
    public $relatives: (Effect[])[] = [[], [], []];
    public $level: number[] = [0, 0, 0,];
    public $penalties: (boolean)[] = [false, false, false];
    public $value: { result: number, explain: string }[] = [{ result: 0, explain: "" }, { result: 0, explain: "" }, { result: 0, explain: "" }];
    public notes: string = "";
    public showNotes: boolean = false;
    constructor(
        public ability: string = "",
        public name: string = "",
        public type: string = "",
        //Locked skills don't show up in skill increase choices.
        public locked: boolean = false,
        public recallKnowledge: boolean = false
    ) { }
    get_Index(creature: Creature) {
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
            case "Familiar":
                index = 2;
                break;
        }
        return index;
    }
    calculate(creature: Creature, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level, isDC: boolean = false) {
        let index = this.get_Index(creature);
        //Level is needed for getting the proper effects and needs to be calculated first.
        if (creature.type == "Familiar") {
            this.$level[index] = 0;
        } else {
            this.$level[index] = this.level((creature as AnimalCompanion|Character), characterService, charLevel);
        }
        this.$ability[index] = this.get_Ability(creature, characterService);
        this.$absolutes[index] = this.absolutes(creature, characterService, effectsService, isDC);
        this.$relatives[index] = this.relatives(creature, characterService, effectsService, isDC);
        this.$penalties[index] = this.penalties(creature, characterService, effectsService, isDC);
        this.$bonuses[index] = this.bonuses(creature, characterService, effectsService, isDC);
        this.$baseValue[index] = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel);
        this.$value[index] = this.value(creature, characterService, abilitiesService, effectsService, charLevel);
        return this;
    }
    level(creature: Character | AnimalCompanion, characterService: CharacterService, charLevel: number = characterService.get_Character().level, excludeTemporary: boolean = false) {
        if (characterService.still_loading()) { return 0; }
        let effectsService = characterService.effectsService;
        let skillLevel: number = 0;
        //If the skill is set by an effect, we can skip every other calculation.
        let skillLevelEffects = effectsService.get_AbsolutesOnThis(creature, this.name + " Proficiency Level");
        if (skillLevelEffects.length) {
            skillLevelEffects.forEach(effect => {
                skillLevel = parseInt(effect.setValue);
            }) 
        } else {
            let increases = creature.get_SkillIncreases(characterService, 0, charLevel, this.name, "", "", undefined, excludeTemporary);
            // Add 2 for each increase, but keep them to their max Rank
            increases = increases.sort((a, b) => (a.maxRank > b.maxRank) ? 1 : -1)
            increases.forEach(increase => {
                skillLevel = Math.min(skillLevel + 2, increase.maxRank);
            })
            //If your proficiency in any non-innate spell attack rolls or spell DCs is expert or better, apply the best of these proficiencies to your innate spells, too.
            if (this.name.includes("Innate") && this.name.includes("Spell DC")) {
                let spellDCs = characterService.get_Skills(creature).filter(skill => skill !== this && skill.name.includes("Spell DC") && !skill.name.includes("Innate"));
                skillLevel = Math.max(skillLevel, ...spellDCs.map(skill => skill.level(creature, characterService, charLevel, excludeTemporary)));
            }
            let proficiencyCopies: ProficiencyCopy[] = [];
            //Collect all the available proficiency copy instructions,
            // (i.e. "Whenever you gain a class feature that grants you expert or greater proficiency in a given weapon or weapons, you also gain that proficiency in...").
            //We check whether you meet the minimum proficiency level by comparing if your skillLevel up to this point.
            characterService.get_FeatsAndFeatures()
                .filter(feat => feat.copyProficiency.length && feat.have(creature, characterService, charLevel, false))
                .forEach(feat => {
                    proficiencyCopies.push(...feat.copyProficiency.filter(copy => 
                        (this.name == copy.name) &&
                        (copy.minLevel ? skillLevel >= copy.minLevel : true)
                    ))
                });
            //For each proficiency copy instruction, collect the desired skill increases, then keep the highest.
            let copyLevels: number[] = [];
            proficiencyCopies.forEach(copy => {
                (creature as Character).class.levels.filter(level => level.number <= creature.level).forEach(level => {
                    copyLevels.push(...
                        level.skillChoices.filter(choice =>
                            (choice.type == copy.type) &&
                            (copy.featuresOnly ? !choice.source.includes("Feat:") : true)
                        ).map(choice => choice.maxRank))
                })
            })
            skillLevel = Math.max(...copyLevels, skillLevel);
            //The Stealthy Companion feat increases the Animal Companion's Stealth rank.
            if (creature.type == "Companion" &&
                this.name == "Stealth" &&
                (creature as AnimalCompanion).class.specializations.find(spec => spec.name == "Ambusher") &&
                characterService.get_Feats("Stealthy Companion")[0]?.have(characterService.get_Character(), characterService)) {
                    skillLevel += 2;
            }
        }
        //Add any relative proficiency level bonuses.
        skillLevelEffects = effectsService.get_RelativesOnThis(creature, this.name + " Proficiency Level");
        skillLevelEffects.forEach(effect => {
            if ([-6,-4,-2,2,4,6].includes(parseInt(effect.value))) {
                skillLevel += parseInt(effect.value);
            }
        })
        skillLevel = Math.min(skillLevel, 8);
        return skillLevel;
    }
    canIncrease(creature: Character, characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
        if (levelNumber >= 15) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(8, maxRank))
        } else if (levelNumber >= 7) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(6, maxRank))
        } else if (levelNumber >= 2) {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(4, maxRank))
        } else {
            return (this.level(creature, characterService, levelNumber, true) < Math.min(2, maxRank))
        }
    }
    isLegal(creature: Character, characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
        if (levelNumber >= 15) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(8, maxRank))
        } else if (levelNumber >= 7) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(6, maxRank))
        } else if (levelNumber >= 2) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(4, maxRank))
        } else {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(2, maxRank))
        }
    }
    get_NamesList(index: number, isDC: boolean = false) {
        let list: string[] = [
            this.name,
            "All Checks and DCs",
            this.$ability[index] + "-based Checks and DCs"
        ]
        if (this.type == "Skill") { list.push("Skill Checks") }
        if (this.type == "Save") { list.push("Saving Throws") }
        if (this.name.includes("Lore")) { list.push("Lore") }
        if (this.name.includes("Spell DC") && !isDC) { list.push("Attack Rolls"); list.push("Spell Attack Rolls") }
        if (this.name.includes("Spell DC") && isDC) { list.push("Spell DCs") }
        if (this.recallKnowledge) { list.push("Recall Knowledge Checks") }
        if (this.recallKnowledge && this.$level[index] >= 6) { list.push("Master Recall Knowledge Checks") }
        return list;
    }
    absolutes(creature: Creature, characterService: CharacterService, effectsService: EffectsService, isDC: boolean = false) {
        let namesList = this.get_NamesList(this.get_Index(creature), isDC);
        if (creature.type != "Familiar" && this.type == "Skill" && this.level((creature as AnimalCompanion|Character), characterService) == 0 && this.type == "Skill") {
            namesList.push("Untrained Skills");
        }return effectsService.get_AbsolutesOnThese(creature, namesList);
    }
    relatives(creature: Creature, characterService: CharacterService, effectsService: EffectsService, isDC: boolean = false) {
        let namesList = this.get_NamesList(this.get_Index(creature), isDC);
        if (creature.type != "Familiar" && this.type == "Skill" && this.level((creature as AnimalCompanion|Character), characterService) == 0) {
            namesList.push("Untrained Skills");
        }
        return effectsService.get_RelativesOnThese(creature, namesList);
    }
    bonuses(creature: Creature, characterService: CharacterService, effectsService: EffectsService, isDC: boolean = false) {
        let namesList = this.get_NamesList(this.get_Index(creature), isDC);
        if (creature.type != "Familiar" && this.type == "Skill" && this.level((creature as AnimalCompanion|Character), characterService) == 0) {
            namesList.push("Untrained Skills");
        }
        return effectsService.show_BonusesOnThese(creature, namesList);
    }
    penalties(creature: Creature, characterService: CharacterService, effectsService: EffectsService, isDC: boolean = false) {
        let namesList = this.get_NamesList(this.get_Index(creature), isDC);
        if (creature.type != "Familiar" && this.type == "Skill" && this.level((creature as AnimalCompanion|Character), characterService) == 0) {
            namesList.push("Untrained Skills");
        }
        return effectsService.show_PenaltiesOnThese(creature, namesList);
    }
    get_Ability(creature: Creature, characterService: CharacterService) {
        if (creature.type == "Familiar") {
            let character = characterService.get_Character();
            //Get the correct ability by identifying the non-innate spellcasting with the same class name as the Familiar's originClass and retrieving its key ability.
            return character.class.spellCasting.find(spellcasting => spellcasting.className == (creature as Familiar).originClass && spellcasting.castingType != "Innate").ability || "Charisma";
        } else {
            if (this.ability) {
                return this.ability;
            } else {
                //Get the correct ability by finding the first key ability boost for the main class or the archetype class.
                if (this.name == characterService.get_Character().class.name + " Class DC") {
                    return characterService.get_Character().get_AbilityBoosts(1, 1, "", "", "Class Key Ability")[0]?.name;
                } else if (this.name.includes(" Class DC") && !this.name.includes(characterService.get_Character().class.name)) {
                    return characterService.get_Character().get_AbilityBoosts(1, characterService.get_Character().level, "", "", this.name.split(" ")[0] + " Key Ability")[0]?.name;
                }
            }
        }
    }
    baseValue(creature: Creature, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        let result: number = 0;
        let explain: string = "";
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
            case "Familiar":
                index = 2;
                break;
        }
        if (!characterService.still_loading()) {
            if (creature.type == "Familiar") {
                //Familiars have special rules:
                //- Saves are equal to the character's before applying circumstance or status effects.
                //- Perception, Acrobatics and Stealth are equal to the character level plus spellcasting modifier (or Charisma).
                //- All others (including attacks) are equal to the character level.
                let character = characterService.get_Character();
                if (["Fortitude", "Reflex", "Will"].includes(this.name)) {
                    let charBaseValue = (this.$baseValue[0].result ? this.$baseValue[0] : this.baseValue(character, characterService, abilitiesService, effectsService, charLevel))
                    result = charBaseValue.result;
                    explain = charBaseValue.explain;
                } else if (["Perception", "Acrobatics", "Stealth"].includes(this.name)) {
                    result = character.level;
                    explain = "Character Level: " + character.level;
                    let spellcastingAbility: string = "Charisma";
                    //Get the correct ability by identifying the non-innate spellcasting with the same class name as the Familiar's originClass and retrieving its key ability.
                    spellcastingAbility = this.get_Ability(creature, characterService);
                    let value = abilitiesService.get_Abilities(spellcastingAbility)[0].mod(character, characterService, effectsService);
                    if (value) {
                        result += value.result;
                        explain += "\nCharacter Spellcasting Ability: " + value.result;
                    }
                } else {
                    result = character.level;
                    explain = "Character Level: " + character.level;
                }
            } else {
                //Add character level if the character is trained or better with the Skill
                //Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat (full level from 7 on).
                //Gets applied to saves and perception, but they are never untrained
                let skillLevel = this.level((creature as AnimalCompanion|Character), characterService, charLevel);
                var charLevelBonus = 0;
                if (skillLevel) {
                    charLevelBonus = charLevel;
                    explain += "\nProficiency Rank: " + skillLevel;
                    explain += "\nCharacter Level: " + charLevelBonus;
                }
                //Add the Ability modifier identified by the skill's ability property
                var abilityMod = 0;
                let ability = this.get_Ability(creature, characterService)
                if (ability) {
                    abilityMod = abilitiesService.get_Abilities(ability)[0].mod((creature as AnimalCompanion|Character), characterService, effectsService).result;
                }
                if (abilityMod) {
                    explain += "\n" + ability + " Modifier: " + abilityMod;
                }
                explain = explain.trim();
                //Add up all modifiers, the skill proficiency and all active effects and return the sum
                result = charLevelBonus + skillLevel + abilityMod;
            }
        }
        return { result: result, explain: explain };
    }
    value(creature: Creature, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level, isDC: boolean = false) {
        //Calculates the effective bonus of the given Skill
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
            case "Familiar":
                index = 2;
                break;
        }
        let result: number = 0;
        let explain: string = "";
        if (!characterService.still_loading()) {
            let baseValue: { result: number, explain: string } = { result: 0, explain: "" };
            baseValue = (this.$baseValue[index].result ? this.$baseValue[index] : this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel))
            result = baseValue.result;
            explain = baseValue.explain;
            //Applying assurance prevents any other bonuses, penalties or modifiers.
            let noRelatives: boolean = false;
            //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
            this.absolutes(creature, characterService, effectsService, isDC).forEach(effect => {
                result = parseInt(effect.setValue)
                explain = effect.source + ": " + effect.setValue;
                if (effect.source.includes("Assurance")) {
                    noRelatives = true;
                }
            });
            let relatives: Effect[] = [];
            //Familiars apply the characters skill value (before circumstance and status effects) on saves
            //We get this by calculating the skill's baseValue and adding effects that aren't circumstance or status effects.
            if (creature.type == "Familiar") {
                let character = characterService.get_Character();
                if (["Fortitude", "Reflex", "Will"].includes(this.name)) {
                    baseValue = (this.$baseValue[0].result ? this.$baseValue[0] : this.baseValue(character, characterService, abilitiesService, effectsService, charLevel))
                    this.absolutes(character, characterService, effectsService, isDC).forEach(effect => {
                        baseValue.result = parseInt(effect.setValue)
                        baseValue.explain = effect.source + ": " + effect.setValue;
                    });
                    relatives.push(...this.relatives(character, characterService, effectsService, isDC).filter(effect => effect.type != "circumstance" && effect.type != "status"));
                }
            }
            //Get all active relative effects on this and sum them up
            if (!noRelatives) {
                relatives.push(...this.relatives(creature, characterService, effectsService, isDC));
                relatives.forEach(effect => {
                    
                    result += parseInt(effect.value);
                    explain += "\n" + effect.source + ": " + effect.value;
                });
            }
        }
        return { result: result, explain: explain.trim() };
    }
}