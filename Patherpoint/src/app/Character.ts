import { Skill } from './Skill';
import { Level } from './Level';
import { Class } from './Class';
import { ItemCollection } from './ItemCollection';
import { Feat } from './Feat';
import { CharacterService } from './character.service';
import { SkillIncrease } from './SkillIncrease';
import { LoreIncrease } from './LoreIncrease';
import { AbilityBoost } from './AbilityBoost';

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
                level.abilityBoosts.filter(boost => 
                    (boost.name == abilityName || abilityName == "") &&
                    (boost.source == source || source == "") &&
                    (boost.type == type || type == "") &&
                    (boost.locked == locked || locked == undefined)
                ).forEach(boost => {
                    boosts.push(boost);
                });
            });
            return boosts;
        }
    }
    boost_Ability(characterService: CharacterService, level: Level, abilityName: string, boost: boolean, availableBoost: AbilityBoost, locked: boolean) {
        if (boost) {
            level.abilityBoosts.push({"name":abilityName, "type":"Boost", "source":availableBoost.source, "locked":locked});
            availableBoost.applied += 1;
        } else {
            let oldBoost = level.abilityBoosts.filter(boost => boost.name == abilityName && boost.type == "Boost" && boost.source == availableBoost.source && boost.locked == locked)[0];
            level.abilityBoosts = level.abilityBoosts.filter(boost => boost !== oldBoost);
            availableBoost.applied -= 1;
        }
        this.set_Changed(characterService);
    }
    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", locked: boolean = undefined) {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillIncreases.filter(increase => 
                    (increase.name == skillName || skillName == "") &&
                    (increase.source == source || increase.source.indexOf(source) > -1 || source == "") &&
                    (increase.locked == locked || locked == undefined)
                    ).forEach(increase => {
                    increases.push(increase);
                })
            })
            return increases;
        }
    }
    increase_Skill(characterService: CharacterService, level: Level, skillName: string, train: boolean, source: SkillIncrease|LoreIncrease, locked: boolean) {
        if (train) {
            level.skillIncreases.push({"name":skillName, "source":source.source, "locked":locked});
            source.applied += 1;
        } else {
            let oldIncrease = level.skillIncreases.filter(increase => increase.name == skillName && increase.source == source.source && increase.locked == increase.locked)[0];
            level.skillIncreases = level.skillIncreases.filter(increase => increase !== oldIncrease);
            source.applied -= 1;
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
                let temporarySource: SkillIncrease = {available:1, applied:1, type:type, maxRank:8, source:'Feat: '+featName};
                this.increase_Skill(characterService, level, feat[0].increase, true, temporarySource, true)
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
                level.availableSkillIncreases.push({available:1, applied:0, type:"Skill", maxRank:2, source:'Feat: '+featName})
            }
            if (feat.length > 0 && feat[0].gainLore) {
                level.availableLoreIncreases.push({available:1, applied:0, loreName:"", loreDesc:"", source:'Feat: '+featName})
            }
        } else {
            let oldFeat = level.feats.filter(feat => feat.name == featName && feat.source == source)[0];
            level.feats = level.feats.filter(feat => feat !== oldFeat);
            let feat = characterService.get_Feats(featName);
            if (feat.length > 0 && feat[0].increase) {
                let temporarySource: SkillIncrease = {available:1, applied:1, type:type, maxRank:8, source:'Feat: '+featName};
                this.increase_Skill(characterService, level, feat[0].increase, false, temporarySource, true)
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
                level.skillIncreases = level.skillIncreases.filter(increase => increase.source != 'Feat: '+featName)
                level.availableSkillIncreases = level.availableSkillIncreases.filter(increase => 
                    (increase.type != "Skill" || increase.source != 'Feat: '+featName));
            }
            if (feat.length > 0 && feat[0].gainLore) {
                let oldAvailableLoreIncrease = level.availableLoreIncreases.filter(increase => increase.source == 'Feat: '+featName)[0];
                if (oldAvailableLoreIncrease.loreName) {
                    characterService.get_Character().class.remove_Lore(characterService, level, oldAvailableLoreIncrease.loreName, oldAvailableLoreIncrease );
                }
                level.availableLoreIncreases = level.availableLoreIncreases.filter(increase => increase.source != 'Feat: '+featName);
            }
        }
        this.set_Changed(characterService);
    }
}