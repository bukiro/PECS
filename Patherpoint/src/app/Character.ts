import { Skill } from './Skill';
import { Level } from './Level';
import { Class } from './Class';
import { Feat } from './Feat';
import { CharacterService } from './character.service';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';
import { FeatChoice } from './FeatChoice';
import { ActivityGain } from './ActivityGain';
import { ActivitiesService } from './activities.service';
import { ItemsService } from './items.service';
import { SpellChoice } from './SpellChoice';
import { Settings } from './Settings';
import { TimeService } from './time.service';
import { SpellCasting } from './SpellCasting';
import { Creature } from './Creature';
import { AbilityBoost } from './AbilityBoost';
import { EffectsService } from './effects.service';
import { SpellsService } from './spells.service';
import { SpellGain } from './SpellGain';
import { Familiar } from './Familiar';
import { SkillIncrease } from './SkillIncrease';
import { Spell } from './Spell';
import { SpellLearned } from './SpellLearned';
import { FeatTaken } from './FeatTaken';

export class Character extends Creature {
    public readonly _className: string = this.constructor.name;
    readonly type = "Character";
    public alignment: string = "";
    public baseValues: {name:string, baseValue:number}[] = [];
    public cash: number[] = [0,15,0,0];
    public class: Class = new Class();
    public customFeats: Feat[] = [];
    public customSkills: Skill[] = [];
    public heroPoints: number = 1;
    public settings: Settings = new Settings();
    get_Changed(characterService: CharacterService, ) {
        return characterService.get_Changed();
    }
    set_Changed(characterService: CharacterService, ) {
        characterService.set_Changed();
    }
    get_Size(effectsService: EffectsService) {
        let size: number = (this.class.ancestry.size ? this.class.ancestry.size : 0);

        let setSizeEffects = effectsService.get_AbsolutesOnThis(this, "Size");
        if (setSizeEffects.length) {
            size = Math.max(...setSizeEffects.map(effect => parseInt(effect.setValue)));
        }
                
        let sizeEffects = effectsService.get_RelativesOnThis(this, "Size");
        sizeEffects.forEach(effect => {
            size += parseInt(effect.value)
        })

        switch (size) {
            case -2:
                return "Tiny";
            case -1:
                return "Small";
            case 0:
                return "Medium"
            case 1:
                return "Large"
            case 2:
                return "Huge"
            case 3:
                return "Gargantuan"
        }
    }
    get_SpellLevel(levelNumber: number = this.level) {
        return Math.ceil(levelNumber / 2);
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
            return boosts as AbilityBoost[];
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
    add_AbilityChoice(level: Level, newChoice: AbilityChoice) {
        let existingChoices = level.abilityChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new AbilityChoice, JSON.parse(JSON.stringify(newChoice)))
        tempChoice.id = level.number +"-Ability-"+ tempChoice.source +"-"+ existingChoices.length;
        let newLength: number = level.abilityChoices.push(tempChoice);
        return level.abilityChoices[newLength-1];
    }
    remove_AbilityChoice(oldChoice: AbilityChoice) {
        let levelNumber = parseInt(oldChoice.id.split("-")[0]);
        let a = this.class.levels[levelNumber].abilityChoices;
        a.splice(a.indexOf(oldChoice), 1);
    }
    get_AbilityChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].abilityChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_SkillChoice(level: Level, newChoice: SkillChoice) {
        let existingChoices = level.skillChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new SkillChoice, JSON.parse(JSON.stringify(newChoice)))
        tempChoice.id = level.number +"-Skill-"+ tempChoice.source +"-"+ existingChoices.length;
        let newLength: number = level.skillChoices.push(tempChoice);
        return level.skillChoices[newLength-1];
    }
    get_SkillChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].skillChoices.filter(choice => choice.id == sourceId)[0];
    }
    remove_SkillChoice(oldChoice: SkillChoice) {
        let levelNumber = parseInt(oldChoice.id.split("-")[0]);
        let a = this.class.levels[levelNumber].skillChoices;
        a.splice(a.indexOf(oldChoice), 1);
    }
    add_SpellCasting(characterService: CharacterService, level: Level, newCasting: SpellCasting) {
        let newLength: number = this.class.spellCasting.push(Object.assign(new SpellCasting(newCasting.castingType), JSON.parse(JSON.stringify(newCasting))));
        let newSpellCasting: SpellCasting = this.class.spellCasting[newLength-1];
        //If the SpellCasting has a charLevelAvailable above 0, but lower than the current level, you could use it before you get it.
        //So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
        if (newSpellCasting.charLevelAvailable) {
            newSpellCasting.charLevelAvailable = Math.max(newSpellCasting.charLevelAvailable, level.number);
        }
        return this.class.spellCasting[newLength-1];
    }
    remove_SpellCasting(characterService: CharacterService, oldCasting: SpellCasting) {
        this.class.spellCasting = this.class.spellCasting.filter(casting => casting !== oldCasting);
    }
    add_LoreChoice(level: Level, newChoice: LoreChoice) {
        let existingChoices = level.loreChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new LoreChoice, JSON.parse(JSON.stringify(newChoice)))
        tempChoice.increases = Object.assign([], newChoice.increases);
        tempChoice.id = level.number +"-Lore-"+ tempChoice.source +"-"+ existingChoices.length;
        let newLength: number = level.loreChoices.push(tempChoice);
        return level.loreChoices[newLength-1];
    }
    get_LoreChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].loreChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_FeatChoice(level: Level, newChoice: FeatChoice) {
        let existingChoices = level.featChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign(new FeatChoice, JSON.parse(JSON.stringify(newChoice)));
        tempChoice.id = level.number +"-"+ (tempChoice.type ? tempChoice.type : "Feat") +"-"+ tempChoice.source +"-"+ existingChoices.length;
        //eval the level string to convert things like "level.number / 2". "1" is still "1".
        if (tempChoice.dynamicLevel) {
            try {
            tempChoice.level = parseInt(eval(tempChoice.dynamicLevel));
            } catch {
                tempChoice.level = level.number;
            }
        }
        let newLength: number = level.featChoices.push(tempChoice);
        level.featChoices[newLength-1].feats.forEach(feat => {
            feat.source = level.featChoices[newLength-1].source;
            feat.sourceId = level.featChoices[newLength-1].id;
        })
        return level.featChoices[newLength-1];
    }
    get_FeatChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].featChoices.filter(choice => choice.id == sourceId)[0];
    }
    add_SpellChoice(level: Level, newChoice: SpellChoice) {
        let spellCasting = this.class.spellCasting
            .find(casting => casting.castingType == newChoice.castingType &&
                (casting.className == newChoice.className || newChoice.className == ""));
        let newLength: number = spellCasting.spellChoices.push(Object.assign(new SpellChoice(), JSON.parse(JSON.stringify(newChoice))));
        let choice = spellCasting.spellChoices[newLength-1];
        choice.spells = choice.spells.map(gain => Object.assign(new SpellGain(), gain));
        //If the choice has a charLevelAvailable lower than the current level, you could choose spells before you officially get this choice.
        //So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
        choice.charLevelAvailable = Math.max(choice.charLevelAvailable, level.number);
        //If the spellcasting was not available so far, it is now.
        if (!spellCasting.charLevelAvailable) {
            spellCasting.charLevelAvailable = choice.charLevelAvailable;
        }
        return choice;
    }
    remove_SpellChoice(characterService: CharacterService, oldChoice: SpellChoice) {
        //Remove the spellChoice by ID
        this.class.spellCasting.forEach(casting => {
            casting.spellChoices = casting.spellChoices.filter(choice => choice.id != oldChoice.id);
        })
        //If the spellcasting has no spellchoices left, it is no longer available.
        this.class.spellCasting.filter(casting => casting.spellChoices.length == 0).forEach(casting => {
            casting.charLevelAvailable = 0;
        })
    }
    gain_Activity(newGain: ActivityGain, levelNumber: number) {
        let newLength = this.class.activities.push(newGain);
        this.class.activities[newLength-1].level = levelNumber;
        return this.class.activities[newLength-1];
    }
    lose_Activity(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, activitiesService: ActivitiesService, oldGain: ActivityGain) {
        let a = this.class.activities;
        if (oldGain.active) {
            activitiesService.activate_Activity(this, "", characterService, timeService, itemsService, spellsService, oldGain, activitiesService.get_Activities(oldGain.name)[0], false);
        }
        a.splice(a.indexOf(oldGain), 1);
    }
    get_SkillIncreases(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let increases: SkillIncrease[] = [];
            let choices: SkillChoice[] = []
            //Collect all skill choices from spellcasting, level and some item runes as well as oils that emulate those runes.
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);
            levels.forEach(level => {
                choices.push(...level.skillChoices);
                choices.push(...level.loreChoices);
            });
            this.inventories.forEach(inventory => {
                inventory.allEquipment().filter(item => item.propertyRunes.filter(rune => rune.loreChoices && rune.loreChoices.length).length && item.equipped && (item.can_Invest() ? item.invested : true ))
                .forEach(item => {
                    item.propertyRunes.filter(rune => rune.loreChoices && rune.loreChoices.length).forEach(rune => {
                        choices.push(...rune.loreChoices);
                    })
                });
                inventory.allEquipment().filter(item => item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length).length && item.equipped && (item.can_Invest() ? item.invested : true ))
                .forEach(item => {
                    item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length).forEach(oil => {
                        choices.push(...oil.runeEffect.loreChoices);
                    })
                });
            })
            //Get all matching skill increases from the choices
            choices.forEach(choice => {
                choice.increases.filter(increase => 
                    (increase.name == skillName || skillName == "") &&
                    (increase.source == source || source == "") &&
                    (increase.sourceId == sourceId || sourceId == "") &&
                    (increase.locked == locked || locked == undefined)
                    ).forEach(increase => {
                    increases.push(increase);
                })
            });
            return increases;
        } else {
            return [] as SkillIncrease[];
        }
    }
    increase_Skill(characterService: CharacterService, skillName: string, train: boolean, choice: SkillChoice, locked: boolean) {
        if (train) {
            choice.increases.push({"name":skillName, "source":choice.source, "maxRank":choice.maxRank, "locked":locked, "sourceId":choice.id});
        } else {
            let oldIncrease = choice.increases.filter(
                increase => increase.name == skillName &&
                increase.source == choice.source &&
                increase.sourceId == choice.id &&
                increase.locked == locked
                )[0];
            choice.increases = choice.increases.filter(increase => increase !== oldIncrease);
        }
        this.process_Skill(characterService, skillName, train, choice, locked);
    }
    process_Skill(characterService: CharacterService, skillName: string, train: boolean, choice: SkillChoice, locked: boolean) {
        if (train) {
            //The skill that you increase with Skilled Heritage at level 1 automatically gets increased at level 5 as well.
            let level = parseInt(choice.id.split("-")[0]);
            if (level == 1 && choice.source == "Skilled Heritage") {
                let newChoice = this.add_SkillChoice(characterService.get_Level(5), Object.assign(new SkillChoice(), {
                    available:0,
                    filter:[],
                    increases:[],
                    type:"Skill",
                    maxRank:8,
                    source:"Skilled Heritage",
                    id:""
                }));
                this.increase_Skill(characterService, skillName, true, newChoice, true);
            }
            //The skill/save that you increase with Canny Acumen automatically gets increased at level 17 as well.
            if (choice.source.includes("Feat: Canny Acumen")) {
                //First check if this has already been done: Is there a Skill Choice at level 17 with this source and this type?
                //We are naming the type "Automatic" - it doesn't matter because it's a locked choice,
                //but it allows us to distinguish this increase from the original if you take Canny Acumen at level 17
                let existingChoices = characterService.get_Level(17).skillChoices.filter(skillChoice =>
                    skillChoice.source == choice.source && skillChoice.type == "Automatic"
                    );
                //If there isn't one, go ahead and create one, then immediately increase this skill in it.
                if (existingChoices.length == 0) {
                    let newChoice = this.add_SkillChoice(characterService.get_Level(17), Object.assign(new SkillChoice(), {
                        available:0,
                        filter:[],
                        increases:[],
                        type:"Automatic",
                        maxRank:6,
                        source:choice.source,
                        id:""
                    }));
                    this.increase_Skill(characterService, skillName, true, newChoice, true);
                }
            }
            //The save that you increase with Path to Perfection is added to the filter of Third Path to Perfection
            if (choice.source == "Path to Perfection" || choice.source == "Second Path to Perfection") {
                let a = characterService.get_Level(15).skillChoices.filter(choice => choice.source == "Third Path to Perfection")[0];
                if (a.filter.includes("none")) {
                    a.filter.splice(a.filter.indexOf("none"),1);
                }
                a.filter.push(skillName);
            }
            //If you are getting trained in a skill you don't already know, it's usually a weapon proficiency or a class/spell DC.
            //We have to create that skill here then
            if (characterService.get_Skills(this, skillName).length == 0) {
                if (skillName.includes("Class DC")) {
                    switch (skillName) {
                        case "Alchemist Class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Intelligence");
                            break;
                        case "Barbarian Class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Strength");
                            break;
                        case "Bard Class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Charisma");
                            break;
                        case "Druid Class DC": 
                            characterService.add_CustomSkill(skillName, "Class DC", "Wisdom");
                            break;
                        default: 
                            //The Ability is the subtype of the taken feat.
                            //The taken feat is found in the source as "Feat: [name]", so we remove the "Feat: " part with substr to find it and its subType.
                            characterService.add_CustomSkill(skillName, "Class DC", characterService.get_Feats(choice.source.substr(6))[0].subType);
                            break;
                    }
                } else if (skillName.includes("Spell DC")) {
                    switch (skillName.split(" ")[0]) {
                        case "Bard": 
                            characterService.add_CustomSkill(skillName, "Spell DC", "Charisma");
                            break;
                        case "Champion": 
                            characterService.add_CustomSkill(skillName, "Spell DC", "Charisma");
                            break;
                        case "Cleric": 
                            characterService.add_CustomSkill(skillName, "Spell DC", "Wisdom");
                            break;
                        case "Druid": 
                            characterService.add_CustomSkill(skillName, "Spell DC", "Wisdom");
                            break;
                        case "Monk":
                            //For Monks, add the tradition to the Monk spellcasting abilities. The tradition is the second word of the skill name.
                            characterService.get_Character().class.spellCasting.filter(casting => casting.className == "Monk").forEach(casting => {
                                casting.tradition = skillName.split(" ")[1] as "Divine"|"Occult";
                            })
                            characterService.add_CustomSkill(skillName, "Spell DC", "Wisdom");
                            break;
                        case "Sorcerer": 
                            characterService.add_CustomSkill(skillName, "Spell DC", "Charisma");
                            break;
                        case "Wizard": 
                            characterService.add_CustomSkill(skillName, "Spell DC", "Intelligence");
                            break;
                        default: 
                        characterService.add_CustomSkill(skillName, "Spell DC", "");
                    }
                //One background grants the "Lore" skill. We treat it as a Lore category skill, but don't generate any feats for it.
                } else if (skillName == "Lore") {
                    characterService.add_CustomSkill(skillName, "Skill", "Intelligence");
                } else {
                    characterService.add_CustomSkill(skillName, choice.type, "");
                }
            }
        } else {
            //If you are deselecting a skill that you increased with Skilled Heritage at level 1, you also lose the skill increase at level 5.
            let level = parseInt(choice.id.split("-")[0]);
            if (level == 1 && choice.source == "Skilled Heritage") {
                characterService.get_Level(5).skillChoices = characterService.get_Level(5).skillChoices.filter(choice => choice.source != "Skilled Heritage");
            }
            //If you are deselecting Canny Acumen, you also lose the skill increase at level 17.
            if (choice.source.includes("Feat: Canny Acumen")) {
                let oldChoices = characterService.get_Level(17).skillChoices.filter(skillChoice => skillChoice.source == choice.source);
                if (oldChoices.length) {
                    this.remove_SkillChoice(oldChoices[0]);
                }
            }
            //If you are deselecting Path to Perfection, the selected skill is removed from the filter of Third Path to Perfection.
            //Also add a blank filter if nothing else is left.
            if (choice.source == "Path to Perfection" || choice.source == "Second Path to Perfection") {
                let a = characterService.get_Level(15).skillChoices.filter(choice => choice.source == "Third Path to Perfection")[0];
                if (a.filter.includes(skillName)) {
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
                //For Monks, add the tradition to the Monk spellcasting abilities. The tradition is the second word of the skill name.
                if (skillName.includes("Monk") && skillName.includes("Spell DC")) {
                    characterService.get_Character().class.spellCasting.filter(casting => casting.className == "Monk").forEach(casting => {
                        casting.tradition = "";
                    })
                }
                
            }
        }
    }
    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let featsTaken: FeatTaken[] = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    choice.feats.filter((feat: FeatTaken) => 
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
    take_Feat(creature: Character|Familiar, characterService: CharacterService, featName: string, taken: boolean, choice: FeatChoice, locked: boolean) {
        let level: Level = characterService.get_Level(parseInt(choice.id.split("-")[0]));
        if (taken) {
            choice.feats.push({"name":featName, "source":choice.source, "locked":locked, "sourceId":choice.id});
            characterService.process_Feat(creature, featName, choice, level, taken);
        } else {
            characterService.process_Feat(creature, featName, choice, level, taken);
            let a = choice.feats;
            a.splice(a.indexOf(a.filter(feat => 
                feat.name == featName &&
                feat.locked == locked
            )[0]), 1)
        }
    }
    get_SpellsTaken(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, spellLevel: number = -1, spellName: string = "", spellCasting: SpellCasting = undefined, className: string = "", tradition: string = "", castingType: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined, signatureAllowed: boolean = false) {
        if (this.class) {
            let spellsTaken: {choice:SpellChoice, gain:SpellGain}[] = [];
            function get_DynamicLevel(choice: SpellChoice, casting: SpellCasting, character: Character, characterService: CharacterService) {
                let highestSpellLevel = 1;
                let Character = this;
                function Skill_Level(name: string) {
                    return characterService.get_Skills(character, name)[0]?.level(character, characterService, character.level) || 0;
                }
                if (casting) {
                    //Get the available spell level of this casting. This is the higest spell level of the spell choices that are available at your character level.
                    highestSpellLevel = Math.max(...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= character.level).map(spellChoice => spellChoice.level));
                }
                try {
                    return parseInt(eval(choice.dynamicLevel));
                } catch (e) {
                    console.log("Error parsing spell level requirement ("+choice.dynamicLevel+"): "+e)
                    return 1;
                }
            }
            this.class.spellCasting
                .filter(casting => (spellCasting == undefined || casting === spellCasting) &&
                    casting.charLevelAvailable >= minLevelNumber && casting.charLevelAvailable <= maxLevelNumber &&
                    (casting.castingType == castingType || castingType == ""))
                    .forEach(casting => {
                        casting.spellChoices.filter(choice => choice.charLevelAvailable >= minLevelNumber && choice.charLevelAvailable <= maxLevelNumber).forEach(choice => {
                            if ((choice.level == spellLevel && !choice.dynamicLevel) || (choice.dynamicLevel && get_DynamicLevel(choice, casting, this, characterService) == spellLevel) || (signatureAllowed && choice.signatureSpell && spellLevel != 0 && spellLevel != -1)) {
                                choice.spells.filter(gain => 
                                    (gain.name == spellName || spellName == "") &&
                                    (casting.className == className || className == "") &&
                                    (casting.tradition == tradition || tradition == "") &&
                                    (choice.source == source || source == "") &&
                                    (gain.sourceId == sourceId || sourceId == "") &&
                                    (gain.locked == locked || locked == undefined) &&
                                    ((signatureAllowed && choice.signatureSpell) ? (spellLevel >= characterService.spellsService.get_Spells(gain.name)[0].levelreq) : true)
                                    ).forEach(gain => {
                                    spellsTaken.push({choice:choice, gain:gain});
                                })
                            }
                        })
            })
            return spellsTaken;
        }
    }
    take_Spell(characterService: CharacterService, spellName: string, taken: boolean, choice: SpellChoice, locked: boolean, prepared: boolean = false) {
        if (taken) {
            choice.spells.push(Object.assign(new SpellGain(), {name:spellName, locked:locked, sourceId:choice.id, source:choice.source, cooldown:choice.cooldown, frequency:choice.frequency, prepared:prepared}));
        } else {
            let oldChoice = choice.spells.find(gain => gain.name == spellName);
            choice.spells.splice(choice.spells.indexOf(oldChoice), 1);
        }
    }
    learn_Spell(spell: Spell, source: string) {
        if (!this.class?.spellBook.filter(learned => learned.name == spell.name).length) {
            let level: number = spell.traits.includes("Cantrip") ? 0 : spell.levelreq;
            this.class?.spellBook.push({name:spell.name, source:source, level:level});
        }
    }
    unlearn_Spell(spell: Spell) {
        this.class.spellBook = this.class.spellBook.filter(existingSpell => existingSpell.name != spell.name);
    }
    get_SpellsLearned(name: string = "", source: string = "", level: number = -1) {
        return this.class?.spellBook.filter(learned =>
            (name ? learned.name == name : true) &&
            (level > -1 ? learned.level == level : true) &&
            (source ? learned.source == source : true)
        );
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
        characterService.set_ToChange("Character", "skills");
        characterService.set_ToChange("Character", "charactersheet");
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
            this.add_SkillChoice(characterService.get_Level(3), Object.assign(new SkillChoice(), {available:1, increases:[], filter:['Lore: '+source.loreName], type:"Skill", maxRank:4, source:"Feat: Additional Lore", id:""}))
            this.add_SkillChoice(characterService.get_Level(7), Object.assign(new SkillChoice(), {available:1, increases:[], filter:['Lore: '+source.loreName], type:"Skill", maxRank:6, source:"Feat: Additional Lore", id:""}))
            this.add_SkillChoice(characterService.get_Level(15), Object.assign(new SkillChoice(), {available:1, increases:[], filter:['Lore: '+source.loreName], type:"Skill", maxRank:8, source:"Feat: Additional Lore", id:""}))
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
            newFeat.featreq = newFeat.featreq.map(featreq => featreq.replace('Lore', 'Lore: '+source.loreName));
            newFeat.lorebase = false;
            newFeat.hide = false;
        })
        characterService.set_ToChange("Character", "skills");
        characterService.set_ToChange("Character", "charactersheet");
    }
}