import { CharacterService } from './character.service';
import { Skill } from './Skill';
import { Ability } from './Ability';
import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';
import { SpellChoice } from './SpellChoice';
import { FormulaChoice } from 'src/FormulaChoice';

export class Feat {
    public name: string = "";
    public superType: string = "";
    public subTypes: boolean = false;
    public subType: string = "";
    public desc: string = "";
    public shortdesc: string = "";
    public hide: boolean = false;
    public lorebase: boolean = false;
    public advancedweaponbase: boolean = false;
    public unlimited: boolean = false;
    public levelreq: number = 0;
    public abilityreq: any[] = [];
    public skillreq: any[] = [];
    public featreq: string = "";
    public specialreqdesc: string = "";
    public specialreq: string = "";
    public showon: string = "";
    public traits: string[] = [];
    public increase: string = "";
    public effects: string[] = [];
    public specialEffects: string[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainLore: true;
    canChoose(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
    //This function evaluates ALL the possible requirements for taking a feat
    //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        if (characterService.still_loading()) { return false }
        //If the feat has a levelreq, check if the level beats that.
        let levelreq: boolean = (this.levelreq) ? (charLevel >= this.levelreq) : true;
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in objects {ability, value}), then check if that ability's baseValue() meets the requirement.
        //Ability requirements are checked without temporary bonuses or penalties
        let abilityreq: boolean = false;
        if (this.abilityreq.length) {
            this.abilityreq.forEach(requirement => {
                let requiredAbility: Ability[] = characterService.get_Abilities(requirement.ability);
                let expected: number = requirement.value;
                if (requiredAbility.length > 0) {
                    requiredAbility.forEach(ability => {
                        if (ability.baseValue(characterService, charLevel) >= expected) {
                            abilityreq = true;
                        }
                    })
                }
            })
        } else {abilityreq = true;}
        //If the feat has a skillreq, first split it into all different requirements,
        //Then check if any one of these requirements {skill, value} are met by the skill's level
        //These are always OR requirements, you never need two skills for a feat.
        let skillreq: boolean = false;
        if (this.skillreq.length) {
            this.skillreq.forEach(requirement => {
                let requiredSkillName: string = requirement.skill;
                let requiredSkill: Skill[] = characterService.get_Skills(requiredSkillName);
                let expected: number = requirement.value;
                if (requiredSkill.length > 0) {
                    requiredSkill.forEach(skill => {
                        if (skill.level(characterService, charLevel) >= expected) {
                            skillreq = true;
                        }
                    })
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
        //When writing the condition, take care that it only uses variables known in this method,
        //and that it remains true even after you take the feat (or it will be automatically removed.)
        let specialreq = (this.specialreq) ? (eval(this.specialreq)) : true;
        //Return true if all are true
        return levelreq && abilityreq && skillreq && featreq && specialreq;
    }
    have(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return false }
        let character = characterService.get_Character();
        let featsTaken = character.get_FeatsTaken(1, charLevel, this.name)
        return featsTaken.length;
    }
}