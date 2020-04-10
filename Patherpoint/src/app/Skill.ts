import { AbilitiesService } from './abilities.service';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { SortByPipe } from './sortBy.pipe';
import { Effect } from './Effect';

export class Skill {
    public notes: string = "";
    public showNotes: boolean = false;
    public $level: number = 0;
    public $value: {result: number, explain: string} = {result:0, explain:""};
    public $effects: Effect[] = [];
    public $bonus: Effect[] = [];
    public $penalty: Effect[] = [];
    constructor(
        public name: string = "",
        public type: string = "",
        public ability: string = "",
    ) { }
    calculate(characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        this.$effects = this.effects(effectsService);
        this.$penalty = this.penalty(effectsService);
        this.$bonus = this.bonus(effectsService);
        this.$level = this.level(characterService, charLevel);
        this.$value = this.value(characterService, abilitiesService, effectsService, charLevel);
        return this;
    }
    level(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let increases = characterService.get_Character().get_SkillIncreases(characterService, 0, charLevel, this.name);
        // Add 2 for each increase, but keep them to their max Rank
        increases = increases.sort((a, b) => (a.maxRank > b.maxRank) ? 1 : -1)
        increases.forEach(increase => {
            skillLevel = Math.min(skillLevel + 2, increase.maxRank);
        })
        //If you have Monastic Weaponry, you can use your unarmed proficiency (up to Master) for Monk weapons
        if (this.name == "Monk" && characterService.get_Feats("Monastic Weaponry")[0].have(characterService)) {
            let unarmedLevel = characterService.get_Skills("Unarmed")[0].level(characterService);
            unarmedLevel = Math.min(unarmedLevel, 6);
            skillLevel = Math.max(skillLevel, unarmedLevel);
        }
        skillLevel = Math.min(skillLevel, 8);
        return skillLevel;
    }
    canIncrease(characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
        if (levelNumber >= 15) {
            return (this.level(characterService, levelNumber) < Math.min(8, maxRank))
        } else if (levelNumber >= 7) {
            return (this.level(characterService, levelNumber) < Math.min(6, maxRank))
        } else if (levelNumber >= 3) {
            return (this.level(characterService, levelNumber) < Math.min(4, maxRank))
        } else {
            return (this.level(characterService, levelNumber) < Math.min(2, maxRank))
        }
    }
    isLegal(characterService: CharacterService, levelNumber: number, maxRank: number = 8) {
        if (levelNumber >= 15) {
            return (this.level(characterService, levelNumber) <= Math.min(8, maxRank))
        } else if (levelNumber >= 7) {
            return (this.level(characterService, levelNumber) <= Math.min(6, maxRank))
        } else if (levelNumber >= 3) {
            return (this.level(characterService, levelNumber) <= Math.min(4, maxRank))
        } else {
            return (this.level(characterService, levelNumber) <= Math.min(2, maxRank))
        }
    }
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(this.name).concat(effectsService.get_EffectsOnThis("All Checks"));
    }
    bonus(effectsService: EffectsService) {
        return effectsService.get_BonusesOnThis(this.name).concat(effectsService.get_BonusesOnThis("All Checks"));;
    }
    penalty(effectsService: EffectsService) {
        return effectsService.get_PenaltiesOnThis(this.name).concat(effectsService.get_PenaltiesOnThis("All Checks"));;
    }
    value(characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
        //Calculates the effective bonus of the given Skill
        //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.getEffects(skill) must be passed
        let result: number = 0;
        let explain: string = "";
        if (!characterService.still_loading()) {
            //Add character level if the character is trained or better with the Skill
            //Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat (full level from 7 on).
            //Gets applied to saves and perception, but they are never untrained
            let skillLevel = this.level(characterService, charLevel);
            if (skillLevel) {
                explain += "\nProficiency: " + skillLevel;
            }
            var charLevelBonus = 0;
            if (skillLevel > 0) {
                charLevelBonus = charLevel;
                explain += "\nCharacter Level: " + charLevelBonus;
            } else if (characterService.get_Feats("Untrained Improvisation")[0].have(characterService)) {
                if (charLevel >= 7) {
                    charLevelBonus = charLevel;
                } else {
                    charLevelBonus = Math.floor(charLevel / 2);
                }
                explain += "\nCharacter Level (Untrained Improvisation): " + charLevelBonus;
            }
            //Add the Ability modifier identified by the skill's ability property
            var abilityMod = 0;
            if (this.ability) {
                abilityMod = abilitiesService.get_Abilities(this.ability)[0].mod(characterService, effectsService);
                if (abilityMod) {
                    explain += "\n" + this.ability + " Modifier: " + abilityMod;
                }
            } else {
                if (this.name == characterService.get_Character().class.name + " class DC") {
                    let keyAbilities = characterService.get_Character().get_AbilityBoosts(1, 1, "", "", "Class Key Ability");
                    if (keyAbilities.length) {
                        abilityMod = abilitiesService.get_Abilities(keyAbilities[0].name)[0].mod(characterService, effectsService);
                        if (abilityMod) {
                            explain += "\n" + keyAbilities[0].name + " Modifier: " + abilityMod;
                        }
                    }
                }
            }
            //For Saving Throws, add any resilient runes on the equipped armor
            let armor = characterService.get_InventoryItems().armors.filter(armor => armor.equipped);
            let resilient: number = 0;
            if (this.type == "Save" && armor.length) {
                if (armor[0].resilientRune > 0) {
                    resilient = armor[0].resilientRune;
                    explain += "\n" + armor[0].get_Resilient(armor[0].resilientRune) + ": +" + armor[0].resilientRune;
                    explain += "\n(" + armor[0].get_Name() + ")";
                }
            }
            //Get all active effects on this and sum them up
            let effects = this.effects(effectsService)
            let effectsSum = 0;
            effects.forEach(effect => {
                effectsSum += parseInt(effect.value);
                explain += "\n" + effect.source + ": " + effect.value;
            });
            explain = explain.substr(1);
            //Add up all modifiers, the skill proficiency and all active effects and return the sum
            result = charLevelBonus + skillLevel + abilityMod + effectsSum + resilient;
        }
        return {result:result, explain:explain};
    }
}