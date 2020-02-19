import { AbilitiesService } from './abilities.service';
import { EffectsService } from './effects.service';
import { CharacterService } from './character.service';
import { Skill } from './Skill';
import { FeatsService } from './feats.service';

export class Feat {
    public name: string = "";
    public desc: string = "";
    public longDesc: string = "";
    public lorebase: boolean = false;
    public unlimited: boolean = false;
    public levelreq: number = 0;
    public abilityreq: string = "";
    public skillreq: string = "";
    public featreq: string = "";
    public specialreq: string = "";
    public showon: string = "";
    public traits: string[] = [];
    public increase: string = "";
    public effects: string[] = [];
    public specialEffect: boolean = false;
    public gainAncestryFeat: number = 0;
    public gainGeneralFeat: number = 0;
    public gainClassFeat: number = 0;
    public gainSkillTraining: number = 0;
    public gainLore: true;
    canChoose(characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level, ignoreCurrentLevel: boolean = false) {
    //This function evaluates ALL the possible requirements for taking a feat
    //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        if (characterService.still_loading()) { return false }
        //First of all, never list "lorebase" feats - these are templates and never used directly
        //Copies are made in in the character's loreFeats individually for every unique lore, and these may show up on this list
        if (this.lorebase) {
            return false;
        }
        //Unless the feat has unlimited=true, it cannot be taken more than once
        //This check is done for one level lower than the current, so that a feat that you just took does not immediately count as unavailable
        let notyettaken = (characterService.get_Character().get_FeatsTaken(0, charLevel - 1, this.name).length == 0) || this.unlimited;
        //If the feat has a levelreq, check if the level beats that.
        let levelreq: boolean = (this.levelreq) ? (charLevel >= this.levelreq) : true;
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in strings like "Dexterity, 12"), then check if that ability's value() meets the requirement. 
        let abilityreq: boolean = (this.abilityreq) ? (abilitiesService.get_Abilities(this.abilityreq.split(",")[0])[0].value(characterService, effectsService) >= parseInt(this.abilityreq.split(",")[1])) : true;
        //If the feat has a skillreq, first split it into all different requirements (they come in strings like "Athletics, 2|Acrobatics, 2" or just "Acrobatics, 2")
        //Then check if any one of these requirements (split into the skill and the number) are met by the skill's level
        //These are always OR requirements, you never need two skills for a feat.
        let skillreq: boolean = false;
        if (this.skillreq) {
            let skillreqs = this.skillreq.split("|");
            skillreqs.forEach(requirement => {
                let requiredSkillName: string = requirement.split(",")[0];
                let requiredSkill: Skill[] = characterService.get_Skills(requiredSkillName);
                let expected:number = parseInt(requirement.split(",")[1]);
                if (requiredSkill.length > 0) {
                    if (requiredSkill[0].level(characterService, charLevel) >= expected) {
                        skillreq = true;
                    }
                }
            });
        } else {skillreq = true;}
        let featreq: boolean = false;
        if (this.featreq) {
            let requiredFeat: Feat[] = characterService.get_Feats(this.featreq);
            if (requiredFeat.length > 0) {
                if (requiredFeat[0].have(characterService, charLevel)) {
                    featreq = true;
                }
            }
        } else {featreq = true;}
        //If the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        let specialreq = (this.specialreq) ? (eval(this.specialreq)) : true;
        //Return true if all are true
        return notyettaken && levelreq && abilityreq && skillreq && featreq && specialreq;
    }
    have(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return false }
        let have: boolean = false;
        let character = characterService.get_Character();
        let featsTaken = character.get_FeatsTaken(0, charLevel, this.name)
        if (featsTaken.length > 0) {have = true}
        return have;
    }
}