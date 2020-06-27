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
import { SpecializationGain } from './SpecializationGain';
import { AbilityChoice } from './AbilityChoice';
import { ItemGain } from './ItemGain';

export class Feat {
    public readonly _className: string = this.constructor.name;
    public abilityreq: any[] = [];
    public access: string = "";
    public advancedweaponbase: boolean = false;
    public anathema: string[] = [];
    public archetype: string = "";
    public data: {} = {};
    public desc: string = "";
    public effects: any[] = [];
    public featreq: string[] = [];
    public gainAbilityChoice: AbilityChoice[] = [];
    public gainActivities: string[] = [];
    public gainAnimalCompanion: number = 0;
    public gainSpecialization: SpecializationGain[] = [];
    public gainFamiliar: boolean = false;
    public gainConditions: ConditionGain[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainItems: ItemGain[] = [];
    public gainLore: true;
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellBookSlots: {spellBookSlots:number[], className:string}[] = [];
    public gainSpellCasting: SpellCasting[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public hide: boolean = false;
    public hint: string = "";
    public levelreq: number = 0;
    public limited: number = 0;
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
    public tenets: string[] = [];
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
                    requiredFeat = characterService.get_FeatsAndFeatures(testfeat, "", true);
                }
                if (requiredFeat.length) {
                    if (requiredFeat.find(feat => feat.have(testcreature, characterService, charLevel))) {
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
        //and that it must remain true even after you take the feat (or the feat will be automatically removed.)
        //As an example, if the requirement is:
        //  (Skill_Level('Athletics') < 2)
        //also include:
        //  (Skill_Level('Athletics') < 4 && this.have(character, characterService, charLevel))
        //
        //Here we prepare variables and functions to use in specialreq evaluations.
        let character: Character = characterService.get_Character();
        charLevel = charLevel;
        let familiar: Familiar = characterService.get_Familiar();
        let deity: Deity = character.class.deity ? characterService.get_Deities(character.class.deity)[0] : null;
        function Skill_Level(creature: string, name: string) {
            if (creature != "Familiar") {
                return characterService.get_Skills(characterService.get_Creature(creature), name)[0]?.level(characterService.get_Creature(creature) as Character|AnimalCompanion, characterService, charLevel) || 0;
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
    canChoose(characterService: CharacterService, charLevel: number = characterService.get_Character().level, skipLevel: boolean = false) {
    //This function evaluates ALL the possible requirements for taking a feat
    //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        if (characterService.still_loading()) { return false }
        //Don't check the level if skipLevel is set. We don't want to list level mismatch when it's obvious.
        let levelreq: boolean = skipLevel || this.meetsLevelReq(characterService, charLevel).met;
        //Check the ability reqs. True if ALL are true.
        let abilityreqs = this.meetsAbilityReq(characterService, charLevel)
        let abilityreq: boolean = abilityreqs.filter(req => req.met == false).length == 0;
        //Check the skill reqs. True if ANY is true.
        let skillreqs = this.meetsSkillReq(characterService, charLevel)
        let skillreq: boolean = skillreqs.filter(req => req.met == true).length > 0;
        //Check the feat reqs. True if ALL are true.
        let featreqs = this.meetsFeatReq(characterService, charLevel);
        let featreq: boolean = featreqs.filter(req => req.met == false).length == 0;
        //Check the special req. True if returns true.
        let specialreq: boolean = this.meetsSpecialReq(characterService, charLevel).met;
        //Return true if all are true
        return levelreq && abilityreq && skillreq && featreq && specialreq;
    }
    have(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, charLevel: number = characterService.get_Character().level, excludeTemporary: boolean = false) {
        if (characterService.still_loading()) { return 0 }
        if (creature.type == "Character") {
            return (creature as Character).get_FeatsTaken(1, charLevel, this.name, "", "", undefined, excludeTemporary)?.length || 0;
        } else if (creature.type == "Familiar") {
            return (creature as Familiar).abilities.feats.filter(gain => gain.name.toLowerCase() == this.name.toLowerCase())?.length || 0;
        } else {
            return 0;
        }
    }
}