import { CharacterService } from './character.service';
import { AbilitiesService } from './abilities.service';

export class Skill {
    public effects: string[] = [];
    public level: number = 0;
    constructor(
        public name: string = "",
        public ability: string = "",
    ) {}
    value(characterService, abilitiesService) {
    //Calculates the effective bonus of the given Skill
    //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.getEffects(skill) must be passed
        if (characterService.still_loading()) { return 0; }
        if (abilitiesService.still_loading()) { return 0; }
        //Add character level if the character is trained or better with the Skill; Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat.
        //Gets applied to saves and perception, but they are never untrained
        var charLevel = characterService.get_Character().level;
        var charLevelBonus = ((this.level > 0) ? charLevel : 0); // ($feats.byName("Untrained Improvisation").have) && Math.floor(charLevel/2));
        //Add the Ability modifier identified by the skill's ability property
        var abilityMod = abilitiesService.get_Abilities('name', this.ability)[0].mod(characterService);
        //Add up all modifiers, the skill proficiency and all active effects, write the result into the skill object for easy access, then return the sum
        //getEffects(skill) has actually already been called and passed into the filter as $effects
        /*var skillResult = charLevelBonus + x.level + abilityMod + $effects;
        x.value = skillResult;
        return skillResult;
*/
        return charLevelBonus + this.level + abilityMod;
    }
}