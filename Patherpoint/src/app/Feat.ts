import { CharacterService } from './character.service';
import { Skill } from './Skill';
import { Ability } from './Ability';
import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';
import { SpellChoice } from './SpellChoice';
import { FormulaChoice } from './FormulaChoice';
import { SpellCasting } from './SpellCasting';
import { Character } from './Character';
import { ConditionGain } from './ConditionGain';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Deity } from './Deity';
import { Speed } from './Speed';
import { CriticalSpecialization } from './CriticalSpecialization';

export class Feat {
    public readonly _className: string = this.constructor.name;
    public abilityreq: any[] = [];
    public access: string = "";
    public advancedweaponbase: boolean = false;
    public archetype: string = "";
    public data: {} = {};
    public desc: string = "";
    public effects: any[] = [];
    public featreq: string[] = [];
    public gainActivities: string[] = [];
    public gainAnimalCompanion: number = 0;
    public gainCritSpecialization: CriticalSpecialization[] = [];
    public gainFamiliar: boolean = false;
    public gainConditions: ConditionGain[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainLore: true;
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public gainSpellCasting: SpellCasting[] = [];
    public hide: boolean = false;
    public hint: string = "";
    public levelreq: number = 0;
    public lorebase: boolean = false;
    public name: string = "";
    public onceEffects: any[] = [];
    public senses: string[] = [];
    public shortdesc: string = "";
    public showon: string = "";
    public skillreq: any[] = [];
    public specialdesc: string = "";
    public specialreq: string = "";
    public specialreqdesc: string = "";
    public subType: string = "";
    public subTypes: boolean = false;
    public superType: string = "";
    public traits: string[] = [];
    public unlimited: boolean = false;
    public sourceBook: string = "";
    public allowSignatureSpells: boolean = false;
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
        let character = characterService.get_Character();
        let result: Array<{met?:boolean, desc?:string}> = [];
        if (this.abilityreq.length) {
            this.abilityreq.forEach(requirement => {
                let requiredAbility: Ability[] = characterService.get_Abilities(requirement.ability);
                let expected: number = requirement.value;
                if (requiredAbility.length > 0) {
                    requiredAbility.forEach(ability => {
                        if (ability.baseValue(character, characterService, charLevel).result >= expected) {
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
        let character = characterService.get_Character();
        let result: Array<{met?:boolean, desc?:string}> = [];
        if (this.skillreq.length) {
            this.skillreq.forEach(requirement => {
                let requiredSkillName: string = requirement.skill;
                let requiredSkill: Skill[] = characterService.get_Skills(character, requiredSkillName);
                let expected: number = requirement.value;
                if (requiredSkill.length > 0) {
                    requiredSkill.forEach(skill => {
                        if (skill.level(character, characterService, charLevel) >= expected) {
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
        let result: Array<{met?:boolean, desc?:string}> = [];
        if (this.featreq.length) {
            this.featreq.forEach(featreq => {
                //Allow to check for the Familiar's feats
                let requiredFeat: Feat[] 
                let testcreature: Character|Familiar;
                let testfeat = featreq;
                if (featreq.includes("Familiar:")) {
                    testcreature = characterService.get_Familiar();
                    testfeat = featreq.substr(9);
                    requiredFeat = characterService.familiarsService.get_FamiliarAbilities(testfeat);
                } else {
                    testcreature = characterService.get_Character();
                    requiredFeat = characterService.get_FeatsAndFeatures(testfeat);
                }
                if (requiredFeat.length > 0) {
                    if (requiredFeat[0].have(testcreature, characterService, charLevel)) {
                        result.push({met:true, desc:featreq});
                    } else {
                        result.push({met:false, desc:featreq});
                    }
                } else {
                    result.push({met:false, desc:featreq});
                }
            })
        } else {
            result.push({met:true, desc:""});
        }
        return result;
    }
    meetsSpecialReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        //When writing the condition, take care that it only uses variables known in this method,
        //and that it must remain true even after you take the feat (or the will be automatically removed.)
        //e.g. if the requirement is (Athletics < 2), also allow (Athletics < 4 && Feat Taken)
        //
        //character and charLevel are often needed for special requirements, so we keep them defined even if we don't use them in the function.
        let character: Character = characterService.get_Character();
        let familiar: Familiar = characterService.get_Familiar();
        let deity: Deity = characterService.get_Deities(character.class.deity)[0];
        function Skill_Level(creature: string, name: string) {
            if (creature != "Familiar") {
                return characterService.get_Skills(characterService.get_Creature(creature), name)[0].level(characterService.get_Creature(creature) as Character|AnimalCompanion, characterService, charLevel);
            } else {
                return 0;
            }
        }
        function Speed(creature: string, name: string) {
            let speeds: Speed[] = characterService.get_Speeds(characterService.get_Creature(creature)).filter(speed => speed.name == name);
            if (speeds.length) {
                return speeds[0].value(characterService.get_Creature(creature), characterService, characterService.effectsService)[0];
            } else {
                return 0;
            }
        }
        if (!deity) {
            deity = new Deity();
        }
        charLevel = charLevel;
        let result: {met:boolean, desc:string};
        if (this.specialreq) {
            try {
                if (eval(this.specialreq)) {
                    result = {met:true, desc:this.specialreqdesc};
                } else {
                    result = {met:false, desc:this.specialreqdesc};
                }
            } catch (error) {
                console.log("Failed evaluating feat requirement (" + this.specialreq + "): " + error)
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
        let levelreq: boolean = this.meetsLevelReq(characterService, charLevel).met;
        //Check the ability reqs. True if ALL are true.
        let abilityreqs = this.meetsAbilityReq(characterService, charLevel)
        let abilityreq: boolean = abilityreqs.filter(req => req.met == false).length == 0;
        //Check the skill reqs. True if ANY is true.
        let skillreqs = this.meetsSkillReq(characterService, charLevel)
        let skillreq: boolean = skillreqs.filter(req => req.met == true).length > 0;
        let featreqs = this.meetsFeatReq(characterService, charLevel);
        let featreq: boolean = featreqs.filter(req => req.met == true).length > 0;
        let specialreq: boolean = this.meetsSpecialReq(characterService, charLevel).met;
        //Return true if all are true
        return levelreq && abilityreq && skillreq && featreq && specialreq;
    }
    have(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return false }
        if (creature.type == "Character") {
            let featsTaken = (creature as Character).get_FeatsTaken(1, charLevel, this.name)
            return featsTaken.length;
        } else if (creature.type == "Familiar") {
            let featsTaken = (creature as Familiar).abilities.feats.filter(gain => gain.name == this.name);
            return featsTaken.length;
        } else {
            return 0;
        }
    }
}