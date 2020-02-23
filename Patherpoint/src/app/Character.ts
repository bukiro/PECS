import { Skill } from './Skill';
import { Level } from './Level';
import { Class } from './Class';
import { ItemCollection } from './ItemCollection';
import { Feat } from './Feat';
import { CharacterService } from './character.service';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';
import { FeatChoice } from './FeatChoice';
import { Health } from './Health';

export class Character {
    public name: string = "";
    public level: number = 1;
    public class: Class = new Class();
    public health: Health = new Health();
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
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined ) {
        if (this.class) {
            let boosts = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.abilityChoices.forEach(choice => {
                    choice.boosts.filter(boost => 
                        (boost.name == abilityName || abilityName == "") &&
                        (boost.type == type || type == "") &&
                        (boost.source == source || source == "") &&
                        (boost.sourceId == sourceId || sourceId == "") &&
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
    get_AbilityChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].abilityChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_SkillChoice(level: Level, newChoice: SkillChoice) {
        let existingChoices = level.skillChoices.filter(choice => choice.source == newChoice.source);
        newChoice.id = level.number +"-Skill-"+ newChoice.source +"-"+ existingChoices.length;
        let newId: number = level.skillChoices.push(newChoice);
        return level.skillChoices[newId-1];
    }
    get_SkillChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].skillChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_LoreChoice(level: Level, newChoice: LoreChoice) {
        let existingChoices = level.loreChoices.filter(choice => choice.source == newChoice.source);
        newChoice.id = level.number +"-Lore-"+ newChoice.source +"-"+ existingChoices.length;
        let newId: number = level.loreChoices.push(newChoice);
        return level.loreChoices[newId-1];
    }
    get_LoreChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].loreChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_FeatChoice(level: Level, newChoice: FeatChoice) {
        let existingChoices = level.featChoices.filter(choice => choice.source == newChoice.source);
        newChoice.id = level.number +"-Feat-"+ newChoice.source +"-"+ existingChoices.length;
        let newId: number = level.featChoices.push(newChoice);
        return level.featChoices[newId-1];
    }
    get_FeatChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].featChoices.filter(choice => choice.id == sourceId)[0];
    }
    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || increase.source.indexOf(source) > -1 || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
                level.loreChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || increase.source.indexOf(source) > -1 || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
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
    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let featsTaken = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    choice.feats.filter(feat => 
                        (feat.name == featName || featName == "") &&
                        (feat.source == source || source == "") &&
                        (feat.sourceId == sourceId || sourceId == "") &&
                        (feat.locked == locked || locked == undefined)
                        ).forEach(feat => {
                        featsTaken.push(feat);
                    })
                })
            })
            return featsTaken;
        }
    }
    take_Feat(characterService: CharacterService, featName: string, taken: boolean, choice: FeatChoice, locked: boolean) {
        let level: Level = characterService.get_Level(parseInt(choice.id[0]));
        if (taken) {
            choice.feats.push({"name":featName, "source":choice.source, "locked":locked, "sourceId":choice.id});
            characterService.process_Feat(featName, level, taken);
        } else {
            let a = choice.feats;
            a.splice(a.indexOf(a.filter(feat => 
                feat.name == featName &&
                feat.locked == locked
            )[0]), 1)
            characterService.process_Feat(featName, level, taken);
        }
        this.set_Changed(characterService);
    }
    remove_Lore(characterService: CharacterService, source: LoreChoice) {
        let loreSkills: Skill[] = [];
        let loreFeats: Feat[] = [];
        loreSkills.push(...characterService.get_Character().customSkills.filter(skill => skill.name == 'Lore: '+source.loreName));
        loreFeats.push(...characterService.get_Character().customFeats.filter(feat => feat.showon == 'Lore: '+source.loreName));

        if (loreSkills.length) {
            loreSkills.forEach(loreSkill => {
                characterService.remove_CustomSkill(loreSkill);
            })
        }
        if (loreFeats.length) {
            loreFeats.forEach(loreFeat => {
                characterService.remove_CustomFeat(loreFeat);
            })
        }
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
    add_Lore(characterService: CharacterService, source: LoreChoice) {
        characterService.add_CustomSkill('Lore: '+source.loreName, "Skill", "Intelligence");
        characterService.get_Character().increase_Skill(characterService, 'Lore: '+source.loreName, true, source, true)
        characterService.get_Feats().filter(feat => feat.lorebase).forEach(lorebase =>{
            let newLength = characterService.add_CustomFeat(lorebase);
            let newFeat = characterService.get_Character().customFeats[newLength -1];
            newFeat.name = newFeat.name.replace('Lore', 'Lore: '+source.loreName);
            newFeat.skillreq = newFeat.skillreq.replace('Lore', 'Lore: '+source.loreName);
            newFeat.showon = newFeat.showon.replace('Lore', 'Lore: '+source.loreName);
            newFeat.lorebase = false;
        })
        characterService.set_Changed();
    }
}