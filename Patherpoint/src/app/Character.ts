import { Skill } from './Skill';
import { Level } from './Level';
import { Class } from './Class';
import { ItemCollection } from './ItemCollection';
import { Feat } from './Feat';
import { CharacterService } from './character.service';

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
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", source: string = "") {
        if (this.class) {
            let boosts = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.abilityBoosts.filter(boost => (boost.name == abilityName || abilityName == "") && (boost.source == source || source == "")).forEach(boost => {
                    boosts.push(boost);
                });
            });
            return boosts;
        }
    }
    boostAbility(characterService: CharacterService, level: Level, abilityName: string, boost: boolean, source: string) {
        if (boost) {
            let background = characterService.get_Character().class.background;
            level.abilityBoosts.push({"name":abilityName, "type":"Boost", "source":source});
            switch (source) {
                case "Level":
                    level.abilityBoosts_applied += 1;
                    break;
                case "Free Ancestry":
                    level.ancestryAbilityBoosts_applied += 1;
                    break;
                case "Key Ability":
                    level.keyAbilityBoosts_applied += 1;
                    break;
                case "Background":
                    level.backgroundAbilityBoosts_applied += 1;
                    background.freeAbilityChoices = [];
                    characterService.get_Abilities().forEach(ability => {
                        if (ability.name != abilityName) {
                            background.freeAbilityChoices.push(ability.name)
                        }
                    });
                    if (this.get_AbilityBoosts(1, 1, abilityName, "Free Background").length) {
                        this.boostAbility(characterService, level, abilityName, false, "Free Background");
                    }
                    break;
                case "Free Background":
                    level.freeBackgroundAbilityBoosts_applied += 1;
                    if (this.get_AbilityBoosts(1, 1, abilityName, "Background").length) {
                        this.boostAbility(characterService, level, abilityName, false, "Background");
                    }
                    break;
            }
        } else {
            let background = characterService.get_Character().class.background;
            let oldBoost = level.abilityBoosts.filter(boost => boost.name == abilityName && boost.type == "Boost" && boost.source == source)[0];
            level.abilityBoosts = level.abilityBoosts.filter(boost => boost !== oldBoost);
            switch (source) {
                case "Level":
                    level.abilityBoosts_applied -= 1;
                    break;
                case "Free Ancestry":
                    level.ancestryAbilityBoosts_applied -= 1;
                    break;
                case "Key Ability":
                    level.keyAbilityBoosts_applied -= 1;
                    break;
                case "Background":
                    level.backgroundAbilityBoosts_applied -= 1;
                    background.freeAbilityChoices = [];
                    characterService.get_Abilities().forEach(ability => {
                        background.freeAbilityChoices.push(ability.name)
                    });
                    break;
                case "Free Background":
                    level.freeBackgroundAbilityBoosts_applied -= 1;
                    break;
            }
        }
        this.set_Changed(characterService);
    }
    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "") {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillIncreases.filter(increase => (increase.name == skillName || skillName == "") && (increase.source == source || source == "")).forEach(increase => {
                    increases.push(increase);
                })
            })
            return increases;
        }
    }
    increaseSkill(characterService: CharacterService, level: Level, skillName: string, train: boolean, source: string) {
        if (train) {
            level.skillIncreases.push({"name":skillName, "source":source});
            if (source == "Level") {
                level.skillIncreases_applied += 1;
            }
            if (source == "Free Background") {
                if (skillName.indexOf("Lore:") > -1) {
                    level.backgroundLore_applied += 1;
                } else {
                    level.backgroundSkillIncreases_applied += 1;
                }
            }
            if (source == "Feat") {
                if (skillName.indexOf("Lore:") > -1) {
                    level.featLore_applied += 1;
                } else if (characterService.get_Skills(skillName)[0].type == "skill") {
                    level.featSkillIncreases_applied += 1;
                }
            }
        } else {
            let oldIncrease = level.skillIncreases.filter(increase => increase.name == skillName && increase.source == source)[0];
            level.skillIncreases = level.skillIncreases.filter(increase => increase !== oldIncrease);
            if (source == "Level") {
                level.skillIncreases_applied -= 1;
            }
            if (source == "Free Background") {
                if (skillName.indexOf("Lore:") > -1) {
                    level.backgroundLore_applied -= 1;
                } else {
                    level.backgroundSkillIncreases_applied -= 1;
                }
            }
            if (source == "Feat") {
                if (skillName.indexOf("Lore:") > -1) {
                    level.featLore_applied -= 1;
                } else if (characterService.get_Skills(skillName)[0].type == "skill") {
                    level.featSkillIncreases_applied -= 1;
                }
            }
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
                this.increaseSkill(characterService, level, feat[0].increase, true, 'Feat')
                //If a feat trains you in a skill you don't already have, it's usually a weapon proficiency
                //We have to create that skill here then
                if (characterService.get_Skills(feat[0].increase).length == 0 ) {
                    characterService.add_CustomSkill(feat[0].increase, "bonusWeaponProf", "")
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
                level.featSkillIncreases_available += 1;
            }
            if (feat.length > 0 && feat[0].gainLore) {
                level.featLore_available += 1;
            }
        } else {
            let oldFeat = level.feats.filter(feat => feat.name == featName && feat.source == source)[0];
            level.feats = level.feats.filter(feat => feat !== oldFeat);
            let feat = characterService.get_Feats(featName);
            if (feat.length > 0 && feat[0].increase) {
                this.increaseSkill(characterService, level, feat[0].increase, false, 'Feat')
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
                level.featSkillIncreases_available -= 1;
            }
            if (feat.length > 0 && feat[0].gainLore) {
                level.featLore_available -= 1;
                if (level.featLoreName) {
                    characterService.get_Character().class.remove_Lore(characterService, level.featLoreName)
                }
            }
        }
        this.set_Changed(characterService);
    }
}