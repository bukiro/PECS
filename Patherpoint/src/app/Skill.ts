import { AbilitiesService } from './abilities.service';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { AnimalCompanion } from './AnimalCompanion';
import { Character } from './Character';

export class Skill {
    public readonly _className: string = this.constructor.name;
    public $baseValue: {result: number, explain: string} = {result:0, explain:""};
    public $bonus: Effect[] = [];
    public $effects: Effect[] = [];
    public $level: number = 0;
    public $penalty: Effect[] = [];
    public $value: {result: number, explain: string} = {result:0, explain:""};
    public notes: string = "";
    public showNotes: boolean = false;
    constructor(
        public ability: string = "",
        public name: string = "",
        public type: string = "",
    ) { }
    calculate(creature: Character|AnimalCompanion, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        this.$effects = this.effects(creature, effectsService);
        this.$penalty = this.penalty(creature, effectsService);
        this.$bonus = this.bonus(creature, effectsService);
        this.$level = this.level(creature, characterService, charLevel);
        this.$baseValue = this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel);
        this.$value = this.value(creature, characterService, abilitiesService, effectsService, charLevel);
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
            let unarmedLevel = characterService.get_Skills(creature, "Unarmed")[0].level(creature, characterService);
            unarmedLevel = Math.min(unarmedLevel, 6);
            skillLevel = Math.max(skillLevel, unarmedLevel);
        }
        skillLevel = Math.min(skillLevel, 8);
        return skillLevel;
    }
    canIncrease(creature: Character|AnimalCompanion, characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
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
    isLegal(creature: Character|AnimalCompanion, characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
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
    effects(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(creature, this.name).concat(effectsService.get_EffectsOnThis(creature, "All Checks"));
    }
    bonus(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(creature, this.name).concat(effectsService.get_BonusesOnThis(creature, "All Checks"));;
    }
    penalty(creature: Character|AnimalCompanion, effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(creature, this.name).concat(effectsService.get_PenaltiesOnThis(creature, "All Checks"));;
    }
    baseValue(creature: Character|AnimalCompanion, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        let result: number = 0;
        let explain: string = "";
        if (!characterService.still_loading()) {
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
                let untrainedImprovisation = effectsService.get_EffectsOnThis(creature, "Untrained Skills");
                if (untrainedImprovisation.length) {
                    untrainedImprovisation.forEach(effect => {
                        charLevelBonus += parseInt(effect.value);
                        explain += "\nCharacter Level Bonus (Untrained Improvisation): " + charLevelBonus;
                    })
                }
            }
            //Add the Ability modifier identified by the skill's ability property
            var abilityMod = 0;
            if (this.ability) {
                abilityMod = abilitiesService.get_Abilities(this.ability)[0].mod(creature, characterService, effectsService);
                if (abilityMod) {
                    explain += "\n" + this.ability + " Modifier: " + abilityMod;
                }
            } else {
                if (this.name == characterService.get_Character().class.name + " class DC") {
                    let keyAbilities = characterService.get_Character().get_AbilityBoosts(1, 1, "", "", "Class Key Ability");
                    if (keyAbilities.length) {
                        abilityMod = abilitiesService.get_Abilities(keyAbilities[0].name)[0].mod(creature, characterService, effectsService);
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
        return {result:result, explain:explain};
    }
    value(creature: Character|AnimalCompanion, characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        //Calculates the effective bonus of the given Skill
        let result: number = 0;
        let explain: string = "";
        if (!characterService.still_loading()) {
            let baseValue = (this.$baseValue.result ? this.$baseValue : this.baseValue(creature, characterService, abilitiesService, effectsService, charLevel))
            result = baseValue.result;
            explain = baseValue.explain
            //Get all active effects on this and sum them up
            let effects = this.effects(creature, effectsService)
            let effectsSum = 0;
            effects.forEach(effect => {
                effectsSum += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
            //Add up all modifiers, the skill proficiency and all active effects and return the sum
            result = result + effectsSum;
        }
        return {result:result, explain:explain};
    }
}