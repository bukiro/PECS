import { Skill } from './Skill';
import { Level } from './Level';
import { Class } from './Class';
import { ItemCollection } from './ItemCollection';
import { Feat } from './Feat';
import { CharacterService } from './character.service';
import { Subject } from 'rxjs';

export class Character {
    public name: string = "";
    public level: number = 1;
    public class: Class = new Class();
    public customSkills: Skill[] = [];
    public loreFeats: Feat[] = [];
    public baseValues = [];
    public inventory: ItemCollection = new ItemCollection();
    get_Changed(characterService: CharacterService, ) {
        return characterService.get_Changed();
    }
    set_Changed(characterService: CharacterService, ) {
        characterService.set_Changed();
    }
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string, source: string = "") {
        if (this.class) {
            let boosts = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.abilityBoosts.filter(boost => boost.name == abilityName && (boost.source == source || source == "")).forEach(boost => {
                    boosts.push(boost);
                })
            })
            return boosts;
        }
    }
    boostAbility(characterService: CharacterService, level: Level, abilityName: string, boost: boolean, source: string) {
        if (boost) {
            level.abilityBoosts.push({"name":abilityName, "type":"boost", "source":source});
            if (source == "level") {
                level.abilityBoosts_applied += 1;
            }
            if (abilityName == "Intelligence" && level.number <= 1) {
                this.class.levels.filter($level => $level.number == 1)[0].skillIncreases_available += 1;
            }
        } else {
            let oldBoost = level.abilityBoosts.filter(boost => boost.name == abilityName && boost.type == "boost" && boost.source == source)[0];
            level.abilityBoosts = level.abilityBoosts.filter(boost => boost !== oldBoost);
            if (source == "level") {
                level.abilityBoosts_applied -= 1;
            }
            if (abilityName == "Intelligence" && level.number <= 1) {
                this.class.levels.filter($level => $level.number == 1)[0].skillIncreases_available -= 1;
            }
        }
        this.set_Changed(characterService);
    }
    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "") {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillIncreases.filter(increase => increase.name == skillName && (increase.source == source || source == "")).forEach(increase => {
                    increases.push(increase);
                })
            })
            return increases;
        }
    }
    increaseSkill(characterService: CharacterService, level: Level, skillName: string, train: boolean, source: string) {
        if (train) {
            level.skillIncreases.push({"name":skillName, "source":source});
            if (source == "level") {
                level.skillIncreases_applied += 1;
            }
        } else {
            let oldIncrease = level.skillIncreases.filter(increase => increase.name == skillName && increase.source == source)[0];
            level.skillIncreases = level.skillIncreases.filter(increase => increase !== oldIncrease);
            if (source == "level") {
                level.skillIncreases_applied -= 1;
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
                this.increaseSkill(characterService, level, feat[0].increase, true, 'feat')
                if (characterService.get_Skills(feat[0].increase).length == 0 ) {
                    characterService.add_customSkill(feat[0].increase, "bonusWeaponProf")
                }
            }
            if (source == "level") {
                switch (type) {
                    case "General":
                        level.generalFeats_applied += 1;
                        break;
                    case "Skill":
                        level.skillFeats_applied += 1;
                        break;
                    case "Ancestry":
                        level.ancestryFeats_applied += 1;
                        break;
                }
            }
            if (feat.length > 0 && feat[0].gainancestryfeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].ancestryFeats_available += 1;
            }
            if (feat.length > 0 && feat[0].gaingeneralfeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].generalFeats_available += 1;
            }
            if (feat.length > 0 && feat[0].gainclassfeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].classFeats_available += 1;
            }
            if (feat.length > 0 && feat[0].gainskilltraining) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].skillIncreases_available += 1;
            }
        } else {
            let oldFeat = level.feats.filter(feat => feat.name == featName && feat.source == source)[0];
            level.feats = level.feats.filter(feat => feat !== oldFeat);
            let feat = characterService.get_Feats(featName);
            if (feat.length > 0 && feat[0].increase) {
                this.increaseSkill(characterService, level, feat[0].increase, false, 'feat')
            }
            if (source == "level") {
                switch (type) {
                    case "General":
                        level.generalFeats_applied -= 1;
                        break;
                    case "Skill":
                        level.skillFeats_applied -= 1;
                        break;
                    case "Ancestry":
                        level.ancestryFeats_applied -= 1;
                        break;
                }
            }
            if (feat.length > 0 && feat[0].gainancestryfeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].ancestryFeats_available -= 1;
            }
            if (feat.length > 0 && feat[0].gaingeneralfeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].generalFeats_available -= 1;
            }
            if (feat.length > 0 && feat[0].gainclassfeat) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].classFeats_available -= 1;
            }
            if (feat.length > 0 && feat[0].gainskilltraining) {
                characterService.get_Character().class.levels.filter(level => level.number == 1)[0].skillIncreases_available -= 1;
            }
        }
        this.set_Changed(characterService);
    }
}