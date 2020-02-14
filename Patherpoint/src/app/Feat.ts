import { AbilitiesService } from './abilities.service';
import { EffectsService } from './effects.service';
import { CharacterService } from './character.service';
import { Skill } from './Skill';

export class Feat {
    public name: string = "";
    public desc: string = "";
    public longDesc: string = "";
    public lorebase: boolean = false;
    public levelreq: number = 0;
    public abilityreq: string = "";
    public skillreq: string = "";
    public featreq: string = "";
    public specialreq: string = "";
    public showon: string = "";
    public traits: string[] = [];
    public effects: string[] = [];
    canChoose(characterService: CharacterService, abilitiesService: AbilitiesService, effectsService: EffectsService, charLevel: number = characterService.get_Character().level) {
    if (characterService.still_loading()) { return false }
    //This function evaluates ALL the possible requirements for taking a feat
    //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        //First of all, never list "lorebase" feats - these are templates and never used directly
        //Copies are made in in the character's loreFeats individually for every unique lore, and these may show up on this list
        if (this.lorebase) {
            return false;
        }
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
                if (requiredSkill) {
                    if (requiredSkill[0].level(characterService) >= expected) {
                        skillreq = true;
                    } 
                } else console.log(this.name + " " + this.skillreq + ": " + requiredSkill[0]);
            });
        } else {skillreq = true;}
        //Lastly, if the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        let specialreq = (this.specialreq) ? (eval(this.specialreq)) : true;
        //Return true if all are true
        return levelreq && abilityreq && skillreq && specialreq;
    }
    have() {

    }
}
