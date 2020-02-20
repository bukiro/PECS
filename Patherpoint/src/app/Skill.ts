import { AbilitiesService } from './abilities.service';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';

export class Skill {
    public notes: string = "";
    public showNotes: boolean = false;
    constructor(
        public name: string = "",
        public type: string = "",
        public ability: string = "",
    ) {}
    level(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let skillLevel: number = 0;
        let increases = characterService.get_Character().get_SkillIncreases(0, charLevel, this.name);
        skillLevel = Math.min(increases.length * 2, 8);
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
    effects(effectsService: EffectsService) {
        return effectsService.get_EffectsOnThis(this.name);
    }
    bonus(effectsService: EffectsService) {
        let effects = this.effects(effectsService);
        let bonus = 0;
        effects.forEach(effect => {
            if (parseInt(effect.value) >= 0) {
                bonus += parseInt(effect.value);
        }});
        return bonus;
    }
    penalty(effectsService: EffectsService) {
        let effects = this.effects(effectsService);
        let penalty = 0;
        effects.forEach(effect => {
            if (parseInt(effect.value) < 0) {
                penalty += parseInt(effect.value);
        }});
        return penalty;
    }
    value(characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
    //Calculates the effective bonus of the given Skill
    //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.getEffects(skill) must be passed
        if (characterService.still_loading()) { return 0; }
        //Add character level if the character is trained or better with the Skill; Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat.
        //Gets applied to saves and perception, but they are never untrained
        let skillLevel = this.level(characterService, charLevel);
        var charLevelBonus = ((skillLevel > 0) ? charLevel : 0); // ($feats.byName("Untrained Improvisation").have) && Math.floor(charLevel/2));
        //Add the Ability modifier identified by the skill's ability property
        var abilityMod = abilitiesService.get_Abilities(this.ability)[0].mod(characterService, effectsService);
        //Get all active effects on this and sum them up
        let bonus = this.bonus(effectsService);
        let penalty = this.penalty(effectsService);
        //Add up all modifiers, the skill proficiency and all active effects and return the sum
        return charLevelBonus + skillLevel + abilityMod + bonus + penalty;
    }
}