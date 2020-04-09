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
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { ConditionGain } from './ConditionGain';
import { ActivityGain } from './ActivityGain';
import { ActivitiesService } from './activities.service';
import { ItemsService } from './items.service';
import { SpellChoice } from './SpellChoice';
import { Settings } from './Settings';
import { TimeService } from './time.service';

export class Character {
    public name: string = "";
    public level: number = 1;
    public class: Class = new Class();
    public health: Health = new Health();
    public customSkills: Skill[] = [];
    public customFeats: Feat[] = [];
    public conditions: ConditionGain[] = [];
    public baseValues: {name:string, baseValue:number}[] = [];
    public inventory: ItemCollection = new ItemCollection();
    public alignment: string = "";
    public deity: string = "";
    public speeds: Speed[] = [new Speed("Speed"), new Speed("Land Speed")];
    public cash: number[] = [0,15,0,0];
    public bulk: Bulk = new Bulk();
    public settings: Settings = new Settings();
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
        let tempChoice = Object.assign(new SkillChoice, JSON.parse(JSON.stringify(newChoice)))
        tempChoice.id = level.number +"-Skill-"+ tempChoice.source +"-"+ existingChoices.length;
        let newIndex: number = level.skillChoices.push(tempChoice);
        return level.skillChoices[newIndex-1];
    }
    get_SkillChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].skillChoices.filter(choice => choice.id == sourceId)[0];
    }
    remove_SkillChoice(oldChoice: SkillChoice) {
        let levelNumber = parseInt(oldChoice.id[0]);
        let a = this.class.levels[levelNumber].skillChoices;
        a.splice(a.indexOf(oldChoice), 1);
    }
    add_LoreChoice(level: Level, newChoice: LoreChoice) {
        let existingChoices = level.loreChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new LoreChoice, JSON.parse(JSON.stringify(newChoice)))
        tempChoice.increases = Object.assign([], newChoice.increases);
        tempChoice.id = level.number +"-Lore-"+ tempChoice.source +"-"+ existingChoices.length;
        let newId: number = level.loreChoices.push(tempChoice);
        return level.loreChoices[newId-1];
    }
    get_LoreChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].loreChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_FeatChoice(level: Level, newChoice: FeatChoice) {
        let existingChoices = level.featChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new FeatChoice, JSON.parse(JSON.stringify(newChoice)));
        tempChoice.id = level.number +"-Feat-"+ tempChoice.source +"-"+ existingChoices.length;
        //eval the level string to convert things like "level.number / 2". "1" is still "1".
        if (tempChoice.level) {
            tempChoice.level = eval(tempChoice.level).toString();
        }
        let newIndex: number = level.featChoices.push(tempChoice);
        return level.featChoices[newIndex-1];
    }
    get_FeatChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].featChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_SpellChoice(level: Level, newChoice: SpellChoice) {
        let existingChoices = level.spellChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new SpellChoice, JSON.parse(JSON.stringify(newChoice)));
        tempChoice.id = level.number +"-Feat-"+ tempChoice.source +"-"+ existingChoices.length;
        let newIndex: number = level.spellChoices.push(tempChoice);
        return level.spellChoices[newIndex-1];
    }
    gain_Activity(newGain: ActivityGain) {
        let newIndex = this.class.activities.push(newGain);
        return this.class.activities[newIndex-1];
    }
    lose_Activity(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, activitiesService: ActivitiesService, oldGain: ActivityGain) {
        let a = this.class.activities;
        activitiesService.activate_Activity(characterService, timeService, itemsService, oldGain, activitiesService.get_Activities(oldGain.name)[0], false);
        a.splice(a.indexOf(oldGain), 1);
    }
    get_SkillIncreases(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
                level.loreChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
            })
            characterService.get_InventoryItems().allEquipment().filter(item => item.loreChoices.length && item.equipped && (item.can_Invest() ? item.invested : true ))
            .forEach(item => {
                item.loreChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || source == "") &&
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
            choice.increases.push({"name":skillName, "source":choice.source, "maxRank":choice.maxRank, "locked":locked, "sourceId":choice.id});
            //The skill that you increase with Skilled Heritage at level 1 automatically gets increased at level 5 as well.
            let level = parseInt(choice.id.split("-")[0]);
            if (level == 1 && choice.source == "Skilled Heritage") {
                let newChoice = this.add_SkillChoice(characterService.get_Level(5), {
                    available:0,
                    filter:[],
                    increases:[],
                    type:"Skill",
                    maxRank:8,
                    source:"Skilled Heritage",
                    id:""
                });
                this.increase_Skill(characterService, skillName, true, newChoice, true);
            }
            //The skill/save that you increase with Canny Acumen automatically gets increased at level 17 as well.
            if (choice.source.indexOf("Feat: Canny Acumen") > -1) {
                //First check if this has already been done: Is there a Skill Choice at level 17 with this source and this type?
                //We are naming the type "Automatic" - it doesn't matter because it's a locked choice,
                //but it allows us to distinguish this increase from the original if you take Canny Acumen at level 17
                let existingChoices = characterService.get_Level(17).skillChoices.filter(skillChoice =>
                    skillChoice.source == choice.source && skillChoice.type == "Automatic"
                    );
                //If there isn't one, go ahead and create one, then immediately increase this skill in it.
                if (existingChoices.length == 0) {
                    let newChoice = this.add_SkillChoice(characterService.get_Level(17), {
                        available:0,
                        filter:[],
                        increases:[],
                        type:"Automatic",
                        maxRank:6,
                        source:choice.source,
                        id:""
                    });
                    this.increase_Skill(characterService, skillName, true, newChoice, true);
                }
            }
            //The save that you increase with Path to Perfection is added to the filter of Third Path to Perfection
            if (choice.source == "Path to Perfection" || choice.source == "Second Path to Perfection") {
                let a = characterService.get_Level(15).skillChoices.filter(choice => choice.source == "Third Path to Perfection")[0];
                if (a.filter.indexOf("none") > -1) {
                    a.filter.splice(a.filter.indexOf("none"),1);
                }
                a.filter.push(skillName);
            }
            //If you are getting trained in a skill you don't already know, it's usually a weapon proficiency or a class DC.
            //We have to create that skill here then
            if (characterService.get_Skills(skillName).length == 0) {
                if (skillName.indexOf("class DC") > -1) {
                    switch (skillName) {
                        case "Alchemist class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Intelligence");
                            break;
                        case "Barbarian class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Strength");
                            break;
                        case "Bard class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Charisma");
                            break;
                        case "Bard class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Dexterity");
                            break;
                        default: 
                            //The Ability is the subtype of the taken feat.
                            //The taken feat is found in the source as "Feat: [name]", so we remove the "Feat: " part with substr to find it and its subType.
                            characterService.add_CustomSkill(skillName, "Class DC", characterService.get_Feats(choice.source.substr(6))[0].subType);
                            break;
                    }
                } else {
                    characterService.add_CustomSkill(skillName, choice["type"], "");
                }
            }
        } else {
            let oldIncrease = choice.increases.filter(
                increase => increase.name == skillName &&
                increase.source == choice.source &&
                increase.sourceId == choice.id &&
                increase.locked == locked
                )[0];
            choice.increases = choice.increases.filter(increase => increase !== oldIncrease);
            //If you are deselecting a skill that you increased with Skilled Heritage at level 1, you also lose the skill increase at level 5.
            let level = parseInt(choice.id.split("-")[0]);
            if (level == 1 && choice.source == "Skilled Heritage") {
                characterService.get_Level(5).skillChoices = characterService.get_Level(5).skillChoices.filter(choice => choice.source != "Skilled Heritage");
            }
            //If you are deselecting Canny Acumen, you also lose the skill increase at level 17.
            if (choice.source.indexOf("Feat: Canny Acumen") > -1) {
                let oldChoices = characterService.get_Level(17).skillChoices.filter(skillChoice => skillChoice.source == choice.source);
                if (oldChoices.length) {
                    this.remove_SkillChoice(oldChoices[0]);
                }
            }
            //If you are deselecting Path to Perfection, the selected skill is removed from the filter of Third Path to Perfection.
            //Also add a blank filter if nothing else is left.
            if (choice.source == "Path to Perfection" || choice.source == "Second Path to Perfection") {
                let a = characterService.get_Level(15).skillChoices.filter(choice => choice.source == "Third Path to Perfection")[0];
                if (a.filter.indexOf(skillName) > -1) {
                    a.filter.splice(a.filter.indexOf(skillName),1);
                }
                if (a.filter.length == 0) {
                    a.filter.push("none");
                }
            }
            //Remove custom skill if previously created and this was the last increase of it
            let customSkills = characterService.get_Character().customSkills.filter(skill => skill.name == skillName);
            if (customSkills.length && this.get_SkillIncreases(characterService, 1, 20, skillName).length == 0) {
                characterService.remove_CustomSkill(customSkills[0]);
            }
        }
        //this.set_Changed(characterService);
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
        let level: Level = characterService.get_Level(parseInt(choice.id.split("-")[0]));
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
    get_SpellsTaken(minLevelNumber: number, maxLevelNumber: number, spellName: string = "", className: string = "", tradition: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let spellsTaken = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.spellChoices.forEach(choice => {
                    choice.spells.filter(gain => 
                        (gain.name == spellName || spellName == "") &&
                        (gain.className == className || className == "") &&
                        (gain.tradition == tradition || tradition == "") &&
                        (gain.source == source || source == "") &&
                        (gain.sourceId == sourceId || sourceId == "") &&
                        (gain.locked == locked || locked == undefined)
                        ).forEach(gain => {
                        spellsTaken.push(gain);
                    })
                })
            })
            return spellsTaken;
        }
    }
    take_Spell(characterService: CharacterService, spellName: string, taken: boolean, choice: SpellChoice, locked: boolean) {
        let level: Level = characterService.get_Level(parseInt(choice.id.split("-")[0]));
        if (taken) {
            choice.spells.push({"name":spellName, "source":choice.source, "className":choice.className, "tradition":choice.tradition, "locked":locked, "sourceId":choice.id});
            characterService.process_Feat(spellName, level, taken);
        } else {
            let a = choice.spells;
            a.splice(a.indexOf(a.filter(gain => 
                gain.name == spellName &&
                gain.locked == locked
            )[0]), 1)
        }
        this.set_Changed(characterService);
    }
    remove_Lore(characterService: CharacterService, source: LoreChoice) {
        //Remove the original Lore training
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            characterService.get_Character().increase_Skill(characterService, 'Lore: '+source.loreName, false, source, true)
        }
        //Go through all levels and remove skill increases for this lore from their respective sources
        //Also remove all Skill Choices that were added for this lore (as happens with the Additional Lore Feat).
        this.class.levels.forEach(level => {
            level.skillChoices.forEach(choice => {
                choice.increases = choice.increases.filter(increase => increase.name != 'Lore: '+source.loreName);
            })
            level.skillChoices = level.skillChoices.filter(choice => choice.filter.filter(filter => filter == 'Lore: '+source.loreName).length == 0);
        });
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
        characterService.set_Changed();
    }
    add_Lore(characterService: CharacterService, source: LoreChoice) {
        //Create the skill on the character
        characterService.add_CustomSkill('Lore: '+source.loreName, "Skill", "Intelligence");
        //Create as many skill increases as the source's initialIncreases value
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            characterService.get_Character().increase_Skill(characterService, 'Lore: '+source.loreName, true, source, true)
        }
        
        //The Additional Lore feat grants a skill increase on Levels 3, 7 and 15 that can only be applied to this lore.
        if (source.source == "Feat: Additional Lore") {
            this.add_SkillChoice(characterService.get_Level(3), {available:1, increases:[], filter:['Lore: '+source.loreName], type:"Skill", maxRank:4, source:"Feat: Additional Lore", id:""})
            this.add_SkillChoice(characterService.get_Level(7), {available:1, increases:[], filter:['Lore: '+source.loreName], type:"Skill", maxRank:6, source:"Feat: Additional Lore", id:""})
            this.add_SkillChoice(characterService.get_Level(15), {available:1, increases:[], filter:['Lore: '+source.loreName], type:"Skill", maxRank:8, source:"Feat: Additional Lore", id:""})
        }
        characterService.get_Feats().filter(feat => feat.lorebase).forEach(lorebaseFeat =>{
            let newLength = characterService.add_CustomFeat(lorebaseFeat);
            let newFeat = characterService.get_Character().customFeats[newLength -1];
            newFeat.name = newFeat.name.replace('Lore', 'Lore: '+source.loreName);
            newFeat.subType = newFeat.subType.replace('Lore', 'Lore: '+source.loreName);
            newFeat.skillreq.forEach(requirement => {
                requirement.skill = requirement.skill.replace('Lore', 'Lore: '+source.loreName);
            })
            newFeat.showon = newFeat.showon.replace('Lore', 'Lore: '+source.loreName);
            newFeat.featreq = newFeat.featreq.replace('Lore', 'Lore: '+source.loreName);
            newFeat.lorebase = false;
            newFeat.hide = false;
        })
        characterService.set_Changed();
    }
}