import { CharacterService } from './character.service';
import { AbilitiesService } from './abilities.service';

export class Skill {
    public effects: string[] = [];
    constructor(
        public name: string = "",
        public type: string = "",
        public ability: string = "",
    ) {}
    level(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return 0; }
        let level: number = 0;
        let increases = characterService.get_Character().get_SkillIncreases(0, charLevel, this);
        level = Math.min(increases.length * 2, 8);
        return level;
    }
    canIncrease(characterService: CharacterService, level) {
        if (level >= 15) {
            return (this.level(characterService, level) < 8)
        } else if (level >= 7) {
            return (this.level(characterService, level) < 6)
        } else if (level >= 3) {
            return (this.level(characterService, level) < 4)
        } else {
            return (this.level(characterService, level) < 2)
        }
    }
    value(characterService: CharacterService, abilitiesService: AbilitiesService, charLevel: number = characterService.get_Character().level) {
    //Calculates the effective bonus of the given Skill
    //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.getEffects(skill) must be passed
        if (characterService.still_loading()) { return 0; }
        //Add character level if the character is trained or better with the Skill; Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat.
        //Gets applied to saves and perception, but they are never untrained
        let skillLevel = this.level(characterService, charLevel);
        var charLevelBonus = ((skillLevel > 0) ? charLevel : 0); // ($feats.byName("Untrained Improvisation").have) && Math.floor(charLevel/2));
        //Add the Ability modifier identified by the skill's ability property
        var abilityMod = abilitiesService.get_Abilities('name', this.ability)[0].mod(characterService);
        //Add up all modifiers, the skill proficiency and all active effects, write the result into the skill object for easy access, then return the sum
        //getEffects(skill) has actually already been called and passed into the filter as $effects
        /*var skillResult = charLevelBonus + x.level + abilityMod + $effects;
        x.value = skillResult;
        return skillResult;
*/
        return charLevelBonus + skillLevel + abilityMod;
    }
}