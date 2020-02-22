import { Skill } from './Skill';
import { Level } from './Level';
import { Class } from './Class';
import { ItemCollection } from './ItemCollection';
import { Feat } from './Feat';
import { CharacterService } from './character.service';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';

export class Character {
    public name: string = "";
    public level: number = 1;
    public class: Class = new Class();
    public customSkills: Skill[] = [];
    public customFeats: Feat[] = [];
    public baseValues = [];
    public inventory: ItemCollection = new ItemCollection();
    get_Changed(characterService: CharacterService, ) {
        return characterService.get_Changed();
    }
    set_Changed(characterService: CharacterService, ) {
        characterService.set_Changed();
    }
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", source: string = "", type: string = "", locked: boolean = undefined ) {
        if (this.class) {
            let boosts = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.abilityChoices.forEach(choice => {
                    choice.boosts.filter(boost => 
                        (boost.name == abilityName || abilityName == "") &&
                        (boost.source == source || source == "") &&
                        (boost.type == type || type == "") &&
                        (boost.locked == locked || locked == undefined)
                    ).forEach(boost => {
                        boosts.push(boost);
                    });
                });
            });
            return boosts;
        }
    }
    boost_Ability(characterService: CharacterService, abilityName: string, boost: boolean, choice: AbilityChoice, locked: boolean) {
        if (boost) {
            choice.boosts.push({"name":abilityName, "type":"Boost", "source":choice.source, "locked":locked, "sourceId":choice.id});
        } else {
            let oldBoost = choice.boosts.filter(boost => 
                boost.name == abilityName &&
                boost.type == "Boost" &&
                boost.source == choice.source &&
                boost.sourceId == choice.id &&
                boost.locked == locked
                )[0];
            choice.boosts = choice.boosts.filter(boost => boost !== oldBoost);
        }
        this.set_Changed(characterService);
    }
    add_SkillChoice(level, newChoice: SkillChoice) {
        let existingChoices = level.skillChoices.filter(choice => choice.source == newChoice.source);
        newChoice.id += existingChoices.length;
        let newId: number = level.skillChoices.push(newChoice);
        return level.skillChoices[newId-1];
    }
    get_SkillIncreaseSource(level, skillIncrease) {
        return level.skillChoices.filter(choice => choice.source == skillIncrease.source && choice.id == skillIncrease.sourceId)[0];
    }
    add_LoreChoice(level, newChoice: LoreChoice) {
        let existingChoices = level.loreChoices.filter(choice => choice.source == newChoice.source);
        newChoice.id += 100 + existingChoices.length;
        let newId: number = level.loreChoices.push(newChoice);
        return level.loreChoices[newId-1];
    } 
    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", locked: boolean = undefined) {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || increase.source.indexOf(source) > -1 || source == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
                level.loreChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || increase.source.indexOf(source) > -1 || source == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
            })
            return increases;
        }
    }
    increase_Skill(characterService: CharacterService, skillName: string, train: boolean, choice: SkillChoice|LoreChoice, locked: boolean) {
        if (train) {
            choice.increases.push({"name":skillName, "source":choice.source, "locked":locked, "sourceId":choice.id});
        } else {
            let oldIncrease = choice.increases.filter(
                increase => increase.name == skillName &&
                increase.source == choice.source &&
                increase.sourceId == choice.id &&
                increase.locked == locked
                )[0];
            choice.increases = choice.increases.filter(increase => increase !== oldIncrease);
        }
        this.set_Changed(characterService);
    }
    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string = "", source: string = "") {
        if (this.class) {
            let featsTaken = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.feats.filter(feat => (feat.name == featName || featName == "") && (feat.source == source || source == "")).forEach(feat => {
                    featsTaken.push(feat);
                })
            })
            return featsTaken;
        }
    }
    takeFeat(characterService: CharacterService, level: Level, featName: string, type: string, take: boolean, source: string) {
        if (take) {
            level.feats.push({"name":featName, "source":source});
            let feat = characterService.get_Feats(featName);
            if (feat.length > 0 && feat[0].increase) {
                let newSkillChoice = this.add_SkillChoice(level, {available:0, increases:[], type:"Any", maxRank:2, source:'Feat: '+featName, id:0});
                this.increase_Skill(characterService, feat[0].increase, true, newSkillChoice, true);
                //If a feat trains you in a skill you don't already have, it's usually a weapon proficiency
                //We have to create that skill here then
                if (characterService.get_Skills(feat[0].increase).length == 0 ) {
                    characterService.add_CustomSkill(feat[0].increase, "Specific Weapon Proficiency", "")
                }
            }
            if (source == "Level") {
                switch (type) {
                    case "General":
                        level.generalFeats_applied += 1;
                        break;
                    case "Class":
                        level.classFeats_applied += 1;
                        break;
                    case "Skill":
                        level.skillFeats_applied += 1;
                        break;
                    case "Ancestry":
                        level.ancestryFeats_applied += 1;
                        break;
                }
            }
            if (feat.length > 0 && feat[0].gainAncestryFeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].ancestryFeats_available += 1;
            }
            if (feat.length > 0 && feat[0].gainGeneralFeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].generalFeats_available += 1;
            }
            if (feat.length > 0 && feat[0].gainClassFeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].classFeats_available += 1;
            }
            if (feat.length > 0 && feat[0].gainSkillTraining) {
                this.add_SkillChoice(level, {available:1, increases:[], type:"Skill", maxRank:2, source:'Feat: '+featName, id:0});
            }
            if (feat.length > 0 && feat[0].gainLore) {
                this.add_LoreChoice(level, {available:1, increases:[], loreName:"", loreDesc:"", source:'Feat: '+featName, id:0});
            }
        } else {
            let oldFeat = level.feats.filter(feat => feat.name == featName && feat.source == source)[0];
            level.feats = level.feats.filter(feat => feat !== oldFeat);
            let feat = characterService.get_Feats(featName);
            if (feat.length > 0 && feat[0].increase) {
                let oldSkillChoice = level.skillChoices.filter(choice => choice.source = 'Feat: '+featName)[0];
                this.increase_Skill(characterService, feat[0].increase, false, oldSkillChoice, true)
            }
            if (source == "Level") {
                switch (type) {
                    case "General":
                        level.generalFeats_applied -= 1;
                        break;
                    case "Class":
                        level.classFeats_applied -= 1;
                        break;
                    case "Skill":
                        level.skillFeats_applied -= 1;
                        break;
                    case "Ancestry":
                        level.ancestryFeats_applied -= 1;
                        break;
                }
            }
            if (feat.length > 0 && feat[0].gainAncestryFeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].ancestryFeats_available -= 1;
            }
            if (feat.length > 0 && feat[0].gainGeneralFeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].generalFeats_available -= 1;
            }
            if (feat.length > 0 && feat[0].gainClassFeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].classFeats_available -= 1;
            }
            if (feat.length > 0 && feat[0].gainSkillTraining) {
                let oldChoices = level.skillChoices.filter(choice => choice.source == 'Feat: '+featName);
                let oldChoice = oldChoices[oldChoices.length-1];
                level.skillChoices = level.skillChoices.filter(choice => !(choice.source == oldChoice.source && choice.id == oldChoice.id))
            }
            if (feat.length > 0 && feat[0].gainLore) {
                let oldChoices = level.loreChoices.filter(choice => choice.source == 'Feat: '+featName);
                let oldChoice = oldChoices[oldChoices.length-1];
                if (oldChoice.loreName) {
                    this.remove_Lore(characterService, level, oldChoice);
                }
                level.loreChoices = level.loreChoices.filter(choice => !(choice.source == oldChoice.source && choice.id == oldChoice.id));
            }
        }
        this.set_Changed(characterService);
    }
    remove_Lore(characterService: CharacterService, level: Level, source: LoreChoice) {
        let loreSkills: Skill[] = [];
        let loreFeats: Feat[] = [];
        loreSkills.push(...characterService.get_Character().customSkills.filter(skill => skill.name == 'Lore: '+source.loreName));
        loreFeats.push(...characterService.get_Character().customFeats.filter(feat => feat.showon == 'Lore: '+source.loreName));

        if (loreSkills.length) {
            loreSkills.forEach(loreSkill => {
                characterService.remove_CustomSkill(loreSkill);
            })
        }
        /*if (loreFeats.length) {
            loreFeats.forEach(loreFeat => {
                characterService.remove_CustomFeat(loreFeat);
            })
        }*/
        //Remove the original Lore training
        characterService.get_Character().increase_Skill(characterService, 'Lore: '+source.loreName, false, source, true);
        //Go through all levels and remove skill increases for this lore from their respective sources
        this.class.levels.forEach(level => {
            level.skillChoices.forEach(choice => {
                choice.increases = choice.increases.filter(increase => increase.name != 'Lore: '+source.loreName);
            })
        });
        characterService.set_Changed();
    }
    add_Lore(characterService: CharacterService, level: Level, source: LoreChoice) {
        characterService.add_CustomSkill('Lore: '+source.loreName, "Skill", "Intelligence");
        characterService.get_Character().increase_Skill(characterService, 'Lore: '+source.loreName, true, source, true)
        //characterService.add_LoreFeat('Lore: '+this.background.loreName, 'Background');
    }
}