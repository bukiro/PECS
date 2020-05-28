import { AbilitiesService } from './abilities.service';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';

export class Skill {
    public readonly _className: string = this.constructor.name;
    public $baseValue: {result: number, explain: string}[] = [{result:0, explain:""},{result:0, explain:""},{result:0, explain:""}];
    public $bonuses: (boolean)[] = [false, false, false];
    public $absolutes: (Effect[])[] = [[],[],[]];
    public $relatives: (Effect[])[] = [[],[],[]];
    public $level: number[] = [0,0,0,];
    public $penalties: (boolean)[] = [false, false, false];
    public $value: {result: number, explain: string}[] = [{result:0, explain:""},{result:0, explain:""},{result:0, explain:""}];
    public notes: string = "";
    public showNotes: boolean = false;
    constructor(
        public ability: string = "",
        public name: string = "",
        public type: string = "",
    ) { }
    calculate(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        let index = 0;
        switch (creature.type) {
            case "Companion":
                index = 1;
                break;
            case "Familiar":
                index = 2;
                break;
        }
        this.$absolutes[index] = this.absolutes(creature, effectsService);
        this.$relatives[index] = this.relatives(creature, effectsService);
        this.$penalties[index] = this.penalties(creature, effectsService);
        this.$bonuses[index] = this.bonuses(creature, effectsService);
        if (creature.type == "Familiar") {
            this.$level[index] = 0;
        } else {
            this.$level[index] = this.level(creature, characterService, charLevel);
        }
        this.$baseValue[index] = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel);
        this.$value[index] = this.value(creature, characterService, abilitiesService, effectsService, charLevel);
        return this;
    }
    level(creature: Character|AnimalCompanion, characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let increases = creature.get_SkillIncreases(characterService, 0, charLevel, this.name);
        // Add 2 for each increase, but keep them to their max Rank
        increases = increases.sort((a, b) => (a.maxRank > b.maxRank) ? 1 : -1)
        increases.forEach(increase => {
            skillLevel = Math.min(skillLevel + 2, increase.maxRank);
        })
        //If you have Monastic Weaponry, you can use your unarmed proficiency (up to Master) for Monk weapons
        if (this.name == "Monk" && characterService.get_Feats("Monastic Weaponry")[0].have(creature, characterService)) {
            let unarmedLevel = characterService.get_Skills(creature, "Unarmed Attacks")[0].level(creature, characterService);
            unarmedLevel = Math.min(unarmedLevel, 6);
            skillLevel = Math.max(skillLevel, unarmedLevel);
        }
        skillLevel = Math.min(skillLevel, 8);
        return skillLevel;
    }
    canIncrease(creature: Character, characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
        if (levelNumber >= 15) {
            return (this.level(creature, characterService, levelNumber) < Math.min(8, maxRank))
        } else if (levelNumber >= 7) {
            return (this.level(creature, characterService, levelNumber) < Math.min(6, maxRank))
        } else if (levelNumber >= 3) {
            return (this.level(creature, characterService, levelNumber) < Math.min(4, maxRank))
        } else {
            return (this.level(creature, characterService, levelNumber) < Math.min(2, maxRank))
        }
    }
    isLegal(creature: Character, characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
        if (levelNumber >= 15) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(8, maxRank))
        } else if (levelNumber >= 7) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(6, maxRank))
        } else if (levelNumber >= 3) {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(4, maxRank))
        } else {
            return (creature.get_SkillIncreases(characterService, 0, levelNumber, this.name).length * 2 <= Math.min(2, maxRank))
        }
    }
    absolutes(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_AbsolutesOnThis(creature, this.name).concat(effectsService.get_AbsolutesOnThis(creature, "All Checks"));
    }
    relatives(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.get_RelativesOnThis(creature, this.name).concat(effectsService.get_RelativesOnThis(creature, "All Checks"));
    }
    bonuses(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.show_BonusesOnThis(creature, this.name) || effectsService.show_BonusesOnThis(creature, "All Checks");
    }
    penalties(creature: Character|AnimalCompanion|Familiar, effectsService: EffectsService) {
        return effectsService.show_PenaltiesOnThis(creature, this.name) || effectsService.show_PenaltiesOnThis(creature, "All Checks");
    }
    baseValue(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
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
                    explain = "Character Level: "+character.level;
                    let spellcastingAbility: string = "Charisma";
                    //Get the correct ability by identifying the non-innate spellcasting with the same class name as the Familiar's originClass and retrieving its key ability.
                    spellcastingAbility = character.class.spellCasting.find(spellcasting => spellcasting.className == creature.originClass && spellcasting.castingType != "Innate").ability || "Charisma";
                    let value = abilitiesService.get_Abilities(spellcastingAbility)[0].mod(character, characterService, effectsService);
                    if (value) {
                        result += value.result;
                        explain += "\nCharacter Spellcasting Ability: "+value.result;
                    }
                } else {
                    result = character.level;
                    explain = "Character Level: "+character.level;
                }
            } else {
                //Add character level if the character is trained or better with the Skill
                //Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat (full level from 7 on).
                //Gets applied to saves and perception, but they are never untrained
                let skillLevel = this.level(creature, characterService, charLevel);
                if (skillLevel) {
                    explain += "\nProficiency: " + skillLevel;
                }
                var charLevelBonus = 0;
                if (skillLevel > 0) {
                    charLevelBonus = charLevel;
                    explain += "\nCharacter Level: " + charLevelBonus;
                } else {
                    let untrainedImprovisation = effectsService.get_AbsolutesOnThis(creature, "Untrained Skills");
                    untrainedImprovisation.forEach(effect => {
                        charLevelBonus = parseInt(effect.setValue);
                        explain = "Character Level Bonus (Untrained Improvisation): " + charLevelBonus;
                    })
                }
                //Add the Ability modifier identified by the skill's ability property
                var abilityMod = 0;
                if (this.ability) {
                    abilityMod = abilitiesService.get_Abilities(this.ability)[0].mod(creature, characterService, effectsService).result;
                    if (abilityMod) {
                        explain += "\n" + this.ability + " Modifier: " + abilityMod;
                    }
                } else {
                    if (this.name == characterService.get_Character().class.name + " Class DC") {
                        let keyAbilities = characterService.get_Character().get_AbilityBoosts(1, 1, "", "", "Class Key Ability");
                        if (keyAbilities.length) {
                            abilityMod = abilitiesService.get_Abilities(keyAbilities[0].name)[0].mod(creature, characterService, effectsService).result;
                            if (abilityMod) {
                                explain += "\n" + keyAbilities[0].name + " Modifier: " + abilityMod;
                            }
                        }
                    }
                }
                explain = explain.substr(1);
                //Add up all modifiers, the skill proficiency and all active effects and return the sum
                result = charLevelBonus + skillLevel + abilityMod;
            }
        }
        return {result:result, explain:explain};
    }
    value(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
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
            let baseValue: {result: number, explain: string} = {result:0, explain:""};
            baseValue = (this.$baseValue[index].result ? this.$baseValue[index] : this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel))
            result = baseValue.result;
            explain = baseValue.explain;
            //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
            this.absolutes(creature, effectsService).forEach(effect => {
                result = parseInt(effect.setValue)
                explain = effect.source + ": " + effect.setValue;
            });
            let relatives: Effect[] = [];
            //Familiars apply the characters skill value (before circumstance and status effects) on saves
            if (creature.type == "Familiar") {
                let character = characterService.get_Character();
                if (["Fortitude", "Reflex", "Will"].includes(this.name)) {
                    baseValue = (this.$baseValue[0].result ? this.$baseValue[0] : this.baseValue(character, characterService, abilitiesService, effectsService, charLevel))
                    this.absolutes(character, effectsService).forEach(effect => {
                        baseValue.result = parseInt(effect.setValue)
                        baseValue.explain = effect.source + ": " + effect.setValue;
                    });
                    relatives.push(...this.relatives(character, effectsService).filter(effect => effect.type != "circumstance" && effect.type != "status"));
                }
            }
            //Get all active relative effects on this and sum them up
            relatives.push(...this.relatives(creature, effectsService));
            relatives.forEach(effect => {
                result += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
        }
        return {result:result, explain:explain};
    }
}