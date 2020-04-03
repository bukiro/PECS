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
    public hint: string = "";
    public shortdesc: string = "";
    public specialdesc: string = "";
    public hide: boolean = false;
    public senses: string = "";
    public lorebase: boolean = false;
    public advancedweaponbase: boolean = false;
    public unlimited: boolean = false;
    public levelreq: number = 0;
    public abilityreq: any[] = [];
    public skillreq: any[] = [];
    public featreq: string = "";
    public specialreqdesc: string = "";
    public specialreq: string = "";
    public access: string = "";
    public showon: string = "";
    public traits: string[] = [];
    public onceEffects: any[] = [];
    public effects: any[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainActivity: string[] = [];
    public gainLore: true;
    public data: {} = {};
    prof(skillLevel: number) {
        switch (skillLevel) {
            case 2:
                return "T"
            case 4:
                return "E"
            case 6:
                return "M"
            case 8:
                return "L"
        }
    }
    meetsLevelReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: {met:boolean, desc:string};
        if (this.levelreq) {
            if (charLevel >= this.levelreq) {
                result = {met:true, desc:"Level "+this.levelreq};
                } else {
                result = {met:false, desc:"Level "+this.levelreq};
            }
        } else {
            result = {met:true, desc:""};
        }
        return result;
    }
    meetsAbilityReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in objects {ability, value}), then check if that ability's baseValue() meets the requirement.
        //Ability requirements are checked without temporary bonuses or penalties
        //Returns an array of [requirement met, requirement description]
        let result: Array<{met?:boolean, desc?:string}> = [];
        if (this.abilityreq.length) {
            this.abilityreq.forEach(requirement => {
                let requiredAbility: Ability[] = characterService.get_Abilities(requirement.ability);
                let expected: number = requirement.value;
                if (requiredAbility.length > 0) {
                    requiredAbility.forEach(ability => {
                        if (ability.baseValue(characterService, charLevel) >= expected) {
                            result.push({met:true, desc:ability.name+" "+expected});
                        } else {
                            result.push({met:false, desc:ability.name+" "+expected});
                        }
                    })
                }
            })
        } else {
            result.push({met:true, desc:""});
        }
        return result;
    }
    meetsSkillReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a skillreq, first split it into all different requirements,
        //Then check if every one of these requirements {skill, value} are met by the skill's level
        //When evaluating the result, these should be treatet as OR requirements - you never need two skills for a feat.
        //Returns an array of [requirement met, requirement description]
        let result: Array<{met?:boolean, desc?:string}> = [];
        if (this.skillreq.length) {
            this.skillreq.forEach(requirement => {
                let requiredSkillName: string = requirement.skill;
                let requiredSkill: Skill[] = characterService.get_Skills(requiredSkillName);
                let expected: number = requirement.value;
                if (requiredSkill.length > 0) {
                    requiredSkill.forEach(skill => {
                        if (skill.level(characterService, charLevel) >= expected) {
                            result.push({met:true, desc:skill.name+" "+this.prof(expected)});
                        } else {
                            result.push({met:false, desc:skill.name+" "+this.prof(expected)});
                        }
                    })
                }
            });
        } else {
            result.push({met:true, desc:""});
        }
        return result;
    }
    meetsFeatReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: {met:boolean, desc:string};
        if (this.featreq) {
            let requiredFeat: Feat[] = characterService.get_FeatsAndFeatures(this.featreq);
            if (requiredFeat.length > 0) {
                if (requiredFeat[0].have(characterService, charLevel)) {
                    result = {met:true, desc:this.featreq};
                } else {
                    result = {met:false, desc:this.featreq};
                }
            } else {
                result = {met:false, desc:""};
            }
        } else {
            result = {met:true, desc:""};
        }
        return result;
    }
    meetsSpecialReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        //When writing the condition, take care that it only uses variables known in this method,
        //and that it must remain true even after you take the feat (or the will be automatically removed.)
        //e.g. if the requirement is (Athletics < 2), also allow (Athletics < 4 && Feat Taken)
        //
        //charLevel is often needed for special requirements, so we keep it defined even if we don't use it in the function.
        let result: {met:boolean, desc:string};
        if (this.specialreq) {
            if (eval(this.specialreq)) {
                result = {met:true, desc:this.specialreqdesc};
            } else {
                result = {met:false, desc:this.specialreqdesc};
            }
        } else {
            result = {met:true, desc:""};
        }
        return result;
    }
    canChoose(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
    //This function evaluates ALL the possible requirements for taking a feat
    //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        if (characterService.still_loading()) { return false }
        if (this.name.indexOf("Lore") > -1) {
            let c=2;
        }
        let levelreq: boolean = this.meetsLevelReq(characterService, charLevel).met;
        //Check the ability reqs. True if ALL are true.
        let abilityreqs = this.meetsAbilityReq(characterService, charLevel)
        let abilityreq: boolean = abilityreqs.filter(req => req.met == false).length == 0;
        //Check the skill reqs. True if ANY is true.
        let skillreqs = this.meetsSkillReq(characterService, charLevel)
        let skillreq: boolean = skillreqs.filter(req => req.met == true).length > 0;
        let featreq: boolean = this.meetsFeatReq(characterService, charLevel).met;
        let specialreq: boolean = this.meetsSpecialReq(characterService, charLevel).met;
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