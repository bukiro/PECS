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
import { LoreChoice } from './LoreChoice';
import { ProficiencyChange } from './ProficiencyChange';
import { HeritageGain } from './HeritageGain';
import { Hint } from './Hint';
import { BloodMagic } from './BloodMagic';
import { Creature } from './Creature';
import { ProficiencyCopy } from './ProficiencyCopy';

export class Feat {
    public readonly _className: string = this.constructor.name;
    public abilityreq: any[] = [];
    public access: string = "";
    //If weaponfeatbase is true, the feat will be copied for every weapon that matches the description in the subtype:
    // Advanced => Advanced Weapons
    // Ancestry => Weapons with a trait that corresponds to an ancestry
    // Uncommon => Weapons with the Uncommon trait
    //These can be combined. Any more filters need to be hardcoded in characterService.create_WeaponFeats().
    public weaponfeatbase: boolean = false;
    public anathema: string[] = [];
    public archetype: string = "";
    public changeProficiency: ProficiencyChange[] = [];
    public copyProficiency: ProficiencyCopy[] = [];
    public bloodMagic: BloodMagic[] = [];
    public data: {} = {};
    public desc: string = "";
    public effects: any[] = [];
    public featreq: string[] = [];
    public heritagereq: string = "";
    //You can add requirements to the ignore list. These get evaluated and must result in "levelreq", "abilityreq", "featreq", "skillreq", "heritagereq" or "dedicationlimit" to do anything.
    public ignoreRequirements: string[] = [];
    public gainAbilityChoice: AbilityChoice[] = [];
    public gainActivities: string[] = [];
    public gainAnimalCompanion: number = 0;
    public gainSpecialization: SpecializationGain[] = [];
    public gainFamiliar: boolean = false;
    public gainConditions: ConditionGain[] = [];
    public gainFeatChoice: FeatChoice[] = [];
    public gainFormulaChoice: FormulaChoice[] = [];
    public gainAncestry: string[] = [];
    public gainHeritage: HeritageGain[] = [];
    public gainItems: ItemGain[] = [];
    public gainLoreChoice: LoreChoice[] = [];
    public gainSkillChoice: SkillChoice[] = [];
    public gainSpellBookSlots: { spellBookSlots: number[], className: string }[] = [];
    public gainSpellListSpells: string[] = [];
    public gainSpellCasting: SpellCasting[] = [];
    public gainSpellChoice: SpellChoice[] = [];
    public hide: boolean = false;
    public hints: Hint[] = [];
    public levelreq: number = 0;
    public limited: number = 0;
    public lorebase: string = "";
    public name: string = "";
    public onceEffects: any[] = [];
    public senses: string[] = [];
    public shortdesc: string = "";
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
    public PFSnote: string = "";
    //For feats with the same name (from different source files for example), higher overridePriority wins. If two have the same priority, the first in the list wins.
    public overridePriority: number = 0;
    prof(skillLevel: number) {
        switch (skillLevel) {
            case 2:
                return "Trained in "
            case 4:
                return "Expert in "
            case 6:
                return "Master in "
            case 8:
                return "Legendary in "
        }
    }
    meetsLevelReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: { met: boolean, desc: string };
        if (this.levelreq) {
            if (charLevel >= this.levelreq) {
                result = { met: true, desc: "Level " + this.levelreq };
            } else {
                result = { met: false, desc: "Level " + this.levelreq };
            }
        } else {
            result = { met: true, desc: "" };
        }
        return result;
    }
    meetsAbilityReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in objects {ability, value}), then check if that ability's baseValue() meets the requirement.
        //Ability requirements are checked without temporary bonuses or penalties
        //Returns an array of [requirement met, requirement description]
        let character = characterService.get_Character();
        let result: Array<{ met?: boolean, desc?: string }> = [];
        if (this.abilityreq.length) {
            this.abilityreq.forEach(requirement => {
                let requiredAbility: Ability[] = characterService.get_Abilities(requirement.ability);
                let expected: number = requirement.value;
                if (requiredAbility.length > 0) {
                    requiredAbility.forEach(ability => {
                        if (ability.baseValue(character, characterService, charLevel).result >= expected) {
                            result.push({ met: true, desc: ability.name + " " + expected });
                        } else {
                            result.push({ met: false, desc: ability.name + " " + expected });
                        }
                    })
                }
            })
        } else {
            result.push({ met: true, desc: "" });
        }
        return result;
    }
    meetsSkillReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a skillreq, first split it into all different requirements,
        //Then check if every one of these requirements {skill, value} are met by the skill's level
        //When evaluating the result, these should be treated as OR requirements - you never need two skillreqs for a feat.
        //Returns an array of [requirement met, requirement description]
        let character = characterService.get_Character();
        let result: Array<{ met?: boolean, desc?: string }> = [];
        let skillreq = JSON.parse(JSON.stringify(this.skillreq));
        //The Versatile Performance feat allows to use Performance instead of Deception, Diplomacy or Intimidation to meet skill requirements for feats.
        //If you have the feat and any of these skills are required, add Performance to the requirements with the lowest required value.
        if (character.get_FeatsTaken(1, charLevel, "Versatile Performance").length) {
            let matchingreqs = skillreq.filter(requirement => ["Deception", "Diplomacy", "Intimidation"].includes(requirement.skill));
            if (matchingreqs.length) {
                let lowest = Math.min(matchingreqs.map(requirement => requirement.value));
                skillreq.push({ skill: "Performance", value: lowest });
            }
        }
        if (skillreq.length) {
            skillreq.forEach(requirement => {
                let requiredSkillName: string = requirement.skill;
                let requiredSkill: Skill[] = characterService.get_Skills(character, requiredSkillName);
                let expected: number = requirement.value;
                if (requiredSkill.length > 0) {
                    if (requiredSkill
                        .find(skill =>
                            skill.level(character, characterService, charLevel, true) >= expected
                        )
                    ) {
                        result.push({ met: true, desc: this.prof(expected) + requirement.skill });
                    } else {
                        result.push({ met: false, desc: this.prof(expected) + requirement.skill });
                    }
                }
            });
        } else {
            result.push({ met: true, desc: "" });
        }
        return result;
    }
    meetsFeatReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a featreq, check if you meet that (or a feat that has this supertype).
        //Returns [requirement met, requirement description]
        //Requirements like "Aggressive Block or Brutish Shove" are split in get_FeatsAndFeatures().
        let result: Array<{ met?: boolean, desc?: string }> = [];
        if (this.featreq.length) {
            this.featreq.forEach(featreq => {
                //Allow to check for the Familiar's feats
                let requiredFeat: Feat[]
                let testcreature: Character | Familiar;
                let testfeat = featreq;

                if (featreq.includes("Familiar:")) {
                    testcreature = characterService.get_Familiar();
                    testfeat = featreq.split("Familiar:")[1].trim();
                    requiredFeat = characterService.familiarsService.get_FamiliarAbilities(testfeat);
                } else {
                    testcreature = characterService.get_Character();
                    requiredFeat = characterService.get_FeatsAndFeatures(testfeat, "", true);
                }
                if (requiredFeat.length) {
                    if (requiredFeat.find(feat => feat.have(testcreature, characterService, charLevel))) {
                        result.push({ met: true, desc: featreq });
                    } else {
                        result.push({ met: false, desc: featreq });
                    }
                } else {
                    result.push({ met: false, desc: featreq });
                }
            })
        } else {
            result.push({ met: true, desc: "" });
        }
        return result;
    }
    meetsHeritageReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the feat has a heritagereq, check if your heritage matches that.
        //Requirements like "irongut goblin heritage or razortooth goblin heritage" are split into each heritage and succeed if either matches your heritage.
        //Returns [requirement met, requirement description]
        let result: Array<{ met?: boolean, desc?: string }> = [];
        if (this.heritagereq) {
            if (
                this.heritagereq.split(" or ").find(heritage =>
                    characterService.get_Character().class?.heritage?.name.toLowerCase() == heritage.toLowerCase() ||
                    characterService.get_Character().class?.additionalHeritages.find(extraHeritage => extraHeritage.name.toLowerCase() == heritage.toLowerCase())
                )
            ) {
                result.push({ met: true, desc: this.heritagereq });
            } else {
                result.push({ met: false, desc: this.heritagereq });
            }
        } else {
            result.push({ met: true, desc: "" });
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
        //charLevel is usually the level on which you take the feat. If none is given, the current character level is used for calculations.
        //The variable is recast here so it can be used in eval().
        charLevel = charLevel;
        let familiar: Familiar = characterService.get_Familiar();
        let deity: Deity = character.class.deity ? characterService.get_Deities(character.class.deity)[0] : null;
        function Skill_Level(creature: string, name: string) {
            if (creature != "Familiar") {
                return characterService.get_Skills(characterService.get_Creature(creature), name)[0]?.level(characterService.get_Creature(creature) as Character | AnimalCompanion, characterService, charLevel) || 0;
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
        function Has_Feat(creature: string, name: string) {
            if (creature == "Familiar") {
                return characterService.featsService.get_All([], name, "", true).find(feat => feat.have(familiar, characterService, charLevel, false));
            } else if (creature == "Character") {
                return characterService.featsService.get_All(character.customFeats, name, "", true).find(feat => feat.have(character, characterService, charLevel, false));
            } else {
                return 0;
            }
        }
        function Has_Sense(creature: string, name: string) {
            return (characterService.get_Senses(characterService.get_Creature(creature), charLevel).includes(name));
        }
        let result: { met: boolean, desc: string };
        if (this.specialreq) {
            try {
                if (eval(this.specialreq)) {
                    result = { met: true, desc: this.specialreqdesc };
                } else {
                    result = { met: false, desc: this.specialreqdesc };
                }
            } catch (error) {
                console.log("Failed evaluating feat requirement (" + this.specialreq + "): " + error)
                result = { met: false, desc: this.specialreqdesc };
            }
        } else {
            result = { met: true, desc: "" };
        }
        return result;
    }
    canChoose(characterService: CharacterService, choiceLevel: number = characterService.get_Character().level, charLevel: number = characterService.get_Character().level, skipLevel: boolean = false, ignoreRequirementsList: string[] = []) {
        //This function evaluates ALL the possible requirements for taking a feat
        //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        //CharLevel is the level the character is at when the feat is taken (so the level extracted from choice.id).
        //ChoiceLevel is choice.level and may differ, for example when you take a 1st-level general feat at 8th level via General Training. It is only used for the level requirement.
        if (isNaN(charLevel)) {
            charLevel == choiceLevel;
        }
        if (characterService.still_loading()) { return false }
        //Don't check the level if skipLevel is set. This is used for subFeats, where the superFeat's levelreq is enough.
        let levelreq: boolean = ignoreRequirementsList.includes("levelreq") || skipLevel || this.meetsLevelReq(characterService, choiceLevel).met;
        //Check the ability reqs. True if ALL are true.
        let abilityreqs = this.meetsAbilityReq(characterService, charLevel)
        let abilityreq: boolean = ignoreRequirementsList.includes("abilityreq") || abilityreqs.filter(req => req.met == false).length == 0;
        //Check the skill reqs. True if ANY is true.
        let skillreqs = this.meetsSkillReq(characterService, charLevel)
        let skillreq: boolean = ignoreRequirementsList.includes("skillreq") || skillreqs.filter(req => req.met == true).length > 0;
        //Check the feat reqs. True if ALL are true.
        let featreqs = this.meetsFeatReq(characterService, charLevel);
        let featreq: boolean = ignoreRequirementsList.includes("featreq") || featreqs.filter(req => req.met == false).length == 0;
        //Check the heritage reqs. True if ALL are true. (There is only one.)
        let heritagereqs = this.meetsHeritageReq(characterService, charLevel);
        let heritagereq: boolean = ignoreRequirementsList.includes("heritagereq") || heritagereqs.filter(req => req.met == false).length == 0;
        //Check the special req. True if returns true.
        let specialreq: boolean = ignoreRequirementsList.includes("specialreq") || this.meetsSpecialReq(characterService, charLevel).met;
        //Return true if all are true
        return levelreq && abilityreq && skillreq && featreq && specialreq && heritagereq;
    }
    have(creature: Creature, characterService: CharacterService, charLevel: number = characterService.get_Character().level, excludeTemporary: boolean = false) {
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