import { Skill } from 'src/app/classes/Skill';
import { Level } from 'src/app/classes/Level';
import { Class } from 'src/app/classes/Class';
import { Feat } from 'src/app/classes/Feat';
import { CharacterService } from 'src/app/services/character.service';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ActivitiesService } from 'src/app/services/activities.service';
import { ItemsService } from 'src/app/services/items.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { Settings } from 'src/app/classes/Settings';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Creature } from 'src/app/classes/Creature';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { EffectsService } from 'src/app/services/effects.service';
import { SpellsService } from 'src/app/services/spells.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { Familiar } from 'src/app/classes/Familiar';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { Spell } from 'src/app/classes/Spell';
import { FeatTaken } from 'src/app/classes/FeatTaken';
import { Item } from 'src/app/classes/Item';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { WornItem } from 'src/app/classes/WornItem';
import { TypeService } from 'src/app/services/type.service';
import { Hint } from 'src/app/classes/Hint';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';

export class Character extends Creature {
    public readonly type = "Character";
    public readonly typeId = 0;
    public appVersionMajor: number = 0;
    public appVersion: number = 0;
    public appVersionMinor: number = 0;
    public ignoredMessages: { id: string, ttl: number }[] = []
    public partyName: string = "";
    public baseValues: { name: string, baseValue: number }[] = [];
    public cash: number[] = [0, 15, 0, 0];
    public class: Class = new Class();
    public customFeats: Feat[] = [];
    public heroPoints: number = 1;
    //Characters get one extra inventory for worn items.
    public inventories: ItemCollection[] = [new ItemCollection(), new ItemCollection(2)];
    public experiencePoints: number = 0;
    public settings: Settings = new Settings();
    public GMMode: boolean = false;
    //yourTurn is only written when saving the character to the database and read when loading.
    public yourTurn: number = 0;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.class = Object.assign(new Class(), this.class).recast(typeService, itemsService);
        this.customFeats = this.customFeats.map(obj => Object.assign(new Feat(), obj).recast());
        this.settings = Object.assign(new Settings(), this.settings);
        return this;
    }
    get_BaseSize(): number {
        return this.class.ancestry.size ? this.class.ancestry.size : 0;
    }
    get_BaseHP(services: { characterService: CharacterService }): { result: number, explain: string } {
        let explain = "";
        let classHP = 0;
        let ancestryHP = 0;
        let charLevel = this.level;
        if (this.class.hitPoints) {
            if (this.class.ancestry.name) {
                ancestryHP = this.class.ancestry.hitPoints;
                explain = "Ancestry base HP: " + ancestryHP;
            }
            let constitution = services.characterService.get_Abilities("Constitution")[0].baseValue(this, services.characterService, charLevel).result;
            let CON: number = Math.floor((constitution - 10) / 2);
            classHP = (this.class.hitPoints + CON) * charLevel;
            explain += "\nClass: " + this.class.hitPoints + " + CON: " + (this.class.hitPoints + CON) + " per Level: " + classHP;
        }
        return { result: classHP + ancestryHP, explain: explain.trim() };
    }
    get_BaseSpeed(speedName: string): { result: number, explain: string } {
        let explain = "";
        let sum = 0;
        if (this.class.ancestry.name) {
            this.class.ancestry.speeds.filter(speed => speed.name == speedName).forEach(speed => {
                sum = speed.value;
                explain = "\n" + this.class.ancestry.name + " base speed: " + sum;
            });
        }
        return { result: sum, explain: explain.trim() };
    }
    get_SpellLevel(levelNumber: number = this.level) {
        return Math.ceil(levelNumber / 2);
    }
    get_DefaultSpellcasting() {
        //Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate. Useful for feat requirements and assigning spell choices to the default spellcasting.
        return this.class.spellCasting.find(casting => casting.className == this.class.name && !["Focus", "Innate"].includes(casting.castingType) && casting.source == this.class.name + " Spellcasting");
    }
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let boosts = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);
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
        let type: string = choice.infoOnly ? "Info" : choice.type;
        if (boost) {
            choice.boosts.push({ "name": abilityName, "type": type, "source": choice.source, "locked": locked, "sourceId": choice.id });
        } else {
            let oldBoost = choice.boosts.filter(boost =>
                boost.name == abilityName &&
                boost.type == type &&
                boost.locked == locked
            )[0];
            choice.boosts = choice.boosts.filter(boost => boost !== oldBoost);
        }
        characterService.refreshService.set_ToChange("Character", "charactersheet");
        characterService.refreshService.set_ToChange("Character", "abilities");
        characterService.refreshService.set_ToChange("Character", "individualskills", "all");
    }
    add_AbilityChoice(level: Level, newChoice: AbilityChoice) {
        let existingChoices = level.abilityChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign<AbilityChoice, AbilityChoice>(new AbilityChoice(), JSON.parse(JSON.stringify(newChoice))).recast();
        tempChoice.id = level.number + "-Ability-" + tempChoice.source + "-" + existingChoices.length;
        let newLength: number = level.abilityChoices.push(tempChoice);
        return level.abilityChoices[newLength - 1];
    }
    remove_AbilityChoice(oldChoice: AbilityChoice) {
        let levelNumber = parseInt(oldChoice.id.split("-")[0]);
        let a = this.class.levels[levelNumber].abilityChoices;
        a.splice(a.indexOf(oldChoice), 1);
    }
    get_AbilityChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].abilityChoices.find(choice => choice.id == sourceId);
    }
    add_SkillChoice(level: Level, newChoice: SkillChoice) {
        let existingChoices = level.skillChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign<SkillChoice, SkillChoice>(new SkillChoice(), JSON.parse(JSON.stringify(newChoice))).recast();
        tempChoice.id = level.number + "-Skill-" + tempChoice.source + "-" + existingChoices.length;
        let newLength: number = level.skillChoices.push(tempChoice);
        return level.skillChoices[newLength - 1];
    }
    get_SkillChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].skillChoices.find(choice => choice.id == sourceId);
    }
    remove_SkillChoice(oldChoice: SkillChoice) {
        let levelNumber = parseInt(oldChoice.id.split("-")[0]);
        let a = this.class.levels[levelNumber].skillChoices;
        a.splice(a.indexOf(oldChoice), 1);
    }
    add_SpellCasting(characterService: CharacterService, level: Level, newCasting: SpellCasting) {
        let newLength: number = this.class.spellCasting.push(Object.assign<SpellCasting, SpellCasting>(new SpellCasting(newCasting.castingType), JSON.parse(JSON.stringify(newCasting))).recast());
        let newSpellCasting: SpellCasting = this.class.spellCasting[newLength - 1];
        //If the SpellCasting has a charLevelAvailable above 0, but lower than the current level, you could use it before you get it.
        //So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
        if (newSpellCasting.charLevelAvailable) {
            newSpellCasting.charLevelAvailable = Math.max(newSpellCasting.charLevelAvailable, level.number);
        }
        characterService.refreshService.set_ToChange("Character", "spellbook");
        characterService.refreshService.set_ToChange("Character", "spells");
        return this.class.spellCasting[newLength - 1];
    }
    remove_SpellCasting(characterService: CharacterService, oldCasting: SpellCasting) {
        this.class.spellCasting = this.class.spellCasting.filter(casting => casting !== oldCasting);
        characterService.refreshService.set_ToChange("Character", "spellbook");
        characterService.refreshService.set_ToChange("Character", "spells");
    }
    add_LoreChoice(level: Level, newChoice: LoreChoice) {
        let existingChoices = level.loreChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign<LoreChoice, LoreChoice>(new LoreChoice(), JSON.parse(JSON.stringify(newChoice))).recast()
        tempChoice.increases = Object.assign([], newChoice.increases);
        tempChoice.id = level.number + "-Lore-" + tempChoice.source + "-" + existingChoices.length;
        let newLength: number = level.loreChoices.push(tempChoice);
        return level.loreChoices[newLength - 1];
    }
    get_LoreChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].loreChoices.find(choice => choice.id == sourceId);
    }
    add_FeatChoice(level: Level, newChoice: FeatChoice) {
        let existingChoices = level.featChoices.filter(choice => choice.source == newChoice.source);
        let tempChoice = Object.assign<FeatChoice, FeatChoice>(new FeatChoice(), JSON.parse(JSON.stringify(newChoice))).recast();
        tempChoice.id = level.number + "-" + (tempChoice.type ? tempChoice.type : "Feat") + "-" + tempChoice.source + "-" + existingChoices.length;
        let newLength: number = level.featChoices.push(tempChoice);
        level.featChoices[newLength - 1].feats.forEach(feat => {
            feat.source = level.featChoices[newLength - 1].source;
            feat.sourceId = level.featChoices[newLength - 1].id;
        })
        return level.featChoices[newLength - 1];
    }
    get_FeatChoice(sourceId: string) {
        let levelNumber = parseInt(sourceId[0]);
        return this.class.levels[levelNumber].featChoices.find(choice => choice.id == sourceId);
    }
    add_SpellChoice(characterService: CharacterService, levelNumber: number, newChoice: SpellChoice) {
        let insertChoice = Object.assign<SpellChoice, SpellChoice>(new SpellChoice(), JSON.parse(JSON.stringify(newChoice))).recast();
        if (insertChoice.className == "Default") {
            insertChoice.className = this.class.name;
        }
        if (insertChoice.castingType == "Default") {
            insertChoice.castingType = this.get_DefaultSpellcasting()?.castingType || "Innate";
        }
        let spellCasting = this.class.spellCasting
            .find(casting =>
                casting.castingType == insertChoice.castingType &&
                (
                    casting.className == insertChoice.className ||
                    insertChoice.className == ""
                )
            );
        if (spellCasting) {
            let newLength: number = spellCasting.spellChoices.push(insertChoice);
            let choice = spellCasting.spellChoices[newLength - 1];
            //If the choice has a charLevelAvailable lower than the current level, you could choose spells before you officially get this choice.
            //So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
            choice.charLevelAvailable = Math.max(choice.charLevelAvailable, levelNumber);
            //If the spellcasting was not available so far, it is now available at your earliest spell choice.
            if (!spellCasting.charLevelAvailable) {
                spellCasting.charLevelAvailable = Math.max(1, Math.min(...spellCasting.spellChoices.map(choice => choice.charLevelAvailable)));
            }
            characterService.refreshService.set_ToChange("Character", "spells");
            characterService.refreshService.set_ToChange("Character", "spellbook");
            return choice;
        } else {
            console.log("No suitable spell casting ability found to add spell choice.")
        }
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
        characterService.refreshService.set_ToChange("Character", "spells");
        characterService.refreshService.set_ToChange("Character", "spellbook");
    }
    gain_Activity(characterService: CharacterService, newGain: ActivityGain, levelNumber: number) {
        let newLength = this.class.activities.push(newGain);
        this.class.activities[newLength - 1].level = levelNumber;
        characterService.refreshService.set_ToChange("Character", "activities");
        return this.class.activities[newLength - 1];
    }
    lose_Activity(characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, activitiesService: ActivitiesService, oldGain: ActivityGain) {
        let a = this.class.activities;
        if (oldGain.active) {
            activitiesService.activate_Activity(this, "", characterService, conditionsService, itemsService, spellsService, oldGain, activitiesService.get_Activities(oldGain.name)[0], false);
        }
        a.splice(a.indexOf(oldGain), 1);
        characterService.refreshService.set_ToChange("Character", "activities");
    }
    get_SkillIncreases(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined, excludeTemporary: boolean = false) {
        if (this.class) {
            let increases: SkillIncrease[] = [];
            let choices: SkillChoice[] = []
            //Collect all skill choices from spellcasting, level and some item runes as well as oils that emulate those runes.
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);
            levels.forEach(level => {
                choices.push(...level.skillChoices.filter(choice => excludeTemporary ? !choice.showOnSheet : true));
                choices.push(...level.loreChoices);
            });
            this.inventories.forEach(inventory => {
                inventory.allEquipment().filter(item => item.propertyRunes.filter(rune => rune.loreChoices && rune.loreChoices.length).length && item.investedOrEquipped())
                    .forEach(item => {
                        item.propertyRunes.filter(rune => rune.loreChoices && rune.loreChoices.length).forEach(rune => {
                            choices.push(...rune.loreChoices);
                        })
                    });
                inventory.allEquipment().filter(item => item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length).length && item.investedOrEquipped())
                    .forEach(item => {
                        item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length).forEach(oil => {
                            choices.push(...oil.runeEffect.loreChoices);
                        })
                    });
            })
            //Only return skill increases for a specific skill if at least one increase has a minRank of 0 (an initial training) - if not, we don't consider this skill increased at all. 
            if (skillName) {
                if (choices.some(choice => choice.minRank == 0 && choice.increases.some(increase => increase.name == skillName))) {
                    //Get all matching skill increases from the choices
                    choices.forEach(choice => {
                        choice.increases.filter(increase =>
                            (increase.name == skillName) &&
                            (increase.source == source || source == "") &&
                            (increase.sourceId == sourceId || sourceId == "") &&
                            (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                            increases.push(increase);
                        })
                    });
                }
            } else {
                //Get all matching skill increases from the choices
                choices.forEach(choice => {
                    choice.increases.filter(increase =>
                        (increase.source == source || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
                        (increase.locked == locked || locked == undefined)
                    ).forEach(increase => {
                        increases.push(increase);
                    })
                });
            }
            return increases;
        } else {
            return [] as SkillIncrease[];
        }
    }
    increase_Skill(characterService: CharacterService, skillName: string, train: boolean, choice: SkillChoice, locked: boolean) {
        if (train) {
            choice.increases.push({ "name": skillName, "source": choice.source, "maxRank": choice.maxRank, "locked": locked, "sourceId": choice.id });
        } else {
            let oldIncrease = choice.increases.filter(
                increase => increase.name == skillName &&
                    increase.locked == locked
            )[0];
            choice.increases = choice.increases.filter(increase => increase !== oldIncrease);
        }
        this.process_Skill(characterService, skillName, train, choice, locked);
    }
    process_Skill(characterService: CharacterService, skillName: string, train: boolean, choice: SkillChoice, locked: boolean) {
        const level = parseInt(choice.id.split("-")[0]);
        characterService.cacheService.set_SkillChanged(skillName, { creatureTypeId: 0, minLevel: level });
        if (skillName.toLowerCase().includes("spell dc")) {
            characterService.cacheService.set_SkillChanged("Any Spell DC", { creatureTypeId: 0, minLevel: level });
        }
        characterService.refreshService.set_ToChange("Character", "individualskills", skillName);
        characterService.refreshService.set_ToChange("Character", "skillchoices", skillName);
        if (train) {
            //The skill that you increase with Skilled Heritage at level 1 automatically gets increased at level 5 as well.
            if (level == 1 && choice.source == "Skilled Heritage") {
                let newChoice = this.add_SkillChoice(characterService.get_Level(5), Object.assign(new SkillChoice(), {
                    available: 0,
                    filter: [],
                    increases: [],
                    type: "Skill",
                    maxRank: 8,
                    source: "Skilled Heritage",
                    id: ""
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
                        available: 0,
                        filter: [],
                        increases: [],
                        type: "Automatic",
                        maxRank: 6,
                        source: choice.source,
                        id: ""
                    }));
                    this.increase_Skill(characterService, skillName, true, newChoice, true);
                }
            }
            //If you are getting trained in a skill you don't already know, it's usually a weapon proficiency or a class/spell DC.
            //We have to create that skill here then
            if (characterService.get_Skills(this, skillName, {}, { noSubstitutions: true }).length == 0) {
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
                                casting.tradition = skillName.split(" ")[1] as "Divine" | "Occult";
                            })
                            characterService.add_CustomSkill(skillName, "Spell DC", "Wisdom");
                            break;
                        case "Rogue":
                            characterService.add_CustomSkill(skillName, "Spell DC", "Charisma");
                            break;
                        case "Sorcerer":
                            characterService.add_CustomSkill(skillName, "Spell DC", "Charisma");
                            break;
                        case "Wizard":
                            characterService.add_CustomSkill(skillName, "Spell DC", "Intelligence");
                            break;
                        case "Innate":
                            characterService.add_CustomSkill(skillName, "Spell DC", "Charisma");
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
            //Set components to update according to the skill type.
            characterService.refreshService.set_ToChange("Character", "featchoices");
            characterService.refreshService.set_ToChange("Character", "skillchoices");
            switch (characterService.get_Skills(characterService.get_Character(), skillName)[0].type) {
                case "Skill":
                    characterService.refreshService.set_ToChange("Character", "skills");
                    break;
                case "Perception":
                    characterService.refreshService.set_ToChange("Character", "skills");
                    break;
                case "Save":
                    characterService.refreshService.set_ToChange("Character", "defense");
                    break;
                case "Armor Proficiency":
                    characterService.refreshService.set_ToChange("Character", "defense");
                    break;
                case "Weapon Proficiency":
                    characterService.refreshService.set_ToChange("Character", "attacks");
                    break;
                case "Specific Weapon Proficiency":
                    characterService.refreshService.set_ToChange("Character", "attacks");
                    break;
                case "Spell DC":
                    characterService.refreshService.set_ToChange("Character", "general");
                    characterService.refreshService.set_ToChange("Character", "spellbook");
                    break;
                case "Class DC":
                    characterService.refreshService.set_ToChange("Character", "general");
                    break;
            }
            //Set components to update according to the skill name.
            switch (skillName) {
                case "Crafting":
                    characterService.refreshService.set_ToChange("Character", "crafting");
                    characterService.refreshService.set_ToChange("Character", "inventory");
                    break;
            }
            //Some effects depend on skill levels, so we refresh effects when changing skills.
            characterService.refreshService.set_ToChange("Character", "effects");
        } else {
            //If you are deselecting a skill that you increased with Skilled Heritage at level 1, you also lose the skill increase at level 5.
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
            //Set components to update according to the skill type.
            characterService.refreshService.set_ToChange("Character", "featchoices");
            characterService.refreshService.set_ToChange("Character", "skillchoices");
            switch (characterService.get_Skills(characterService.get_Character(), skillName)[0]?.type) {
                case "Skill":
                    characterService.refreshService.set_ToChange("Character", "skills");
                    characterService.refreshService.set_ToChange("Character", "individualskills", "all");
                    break;
                case "Perception":
                    characterService.refreshService.set_ToChange("Character", "skills");
                    break;
                case "Save":
                    characterService.refreshService.set_ToChange("Character", "defense");
                    break;
                case "Armor Proficiency":
                    characterService.refreshService.set_ToChange("Character", "defense");
                    break;
                case "Weapon Proficiency":
                    characterService.refreshService.set_ToChange("Character", "attacks");
                    break;
                case "Specific Weapon Proficiency":
                    characterService.refreshService.set_ToChange("Character", "attacks");
                    break;
                case "Spell DC":
                    characterService.refreshService.set_ToChange("Character", "general");
                    characterService.refreshService.set_ToChange("Character", "spellbook");
                    break;
                case "Class DC":
                    characterService.refreshService.set_ToChange("Character", "general");
                    break;
            }
            //Set components to update according to the skill name.
            switch (skillName) {
                case "Crafting":
                    characterService.refreshService.set_ToChange("Character", "crafting");
                    characterService.refreshService.set_ToChange("Character", "inventory");
                    break;
            }
            //Some effects depend on skill levels, so we refresh effects when changing skills.
            characterService.refreshService.set_ToChange("Character", "effects");
            //Remove custom skill if previously created and this was the last increase of it
            let customSkills = characterService.get_Character().customSkills.filter(skill => skill.name == skillName);
            if (customSkills.length && this.get_SkillIncreases(characterService, 1, 20, skillName).length == 0) {
                characterService.remove_CustomSkill(customSkills[0]);
                //For Monks, remove the tradition from the Monk spellcasting abilities if you removed the Monk Divine/Occult Spell DC.
                if (skillName.includes("Monk") && skillName.includes("Spell DC")) {
                    characterService.get_Character().class.spellCasting.filter(casting => casting.className == "Monk").forEach(casting => {
                        casting.tradition = "";
                    })
                }
            }
        }
    }
    get_FeatsTaken(minLevelNumber: number = 0, maxLevelNumber: number = 0, featName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined, excludeTemporary: boolean = false, includeCountAs: boolean = false, automatic: boolean = undefined) {
        if (this.class) {
            let featsTaken: FeatTaken[] = [];
            let levels = this.class.levels.filter(level => (!minLevelNumber || level.number >= minLevelNumber) && (!maxLevelNumber || level.number <= maxLevelNumber));
            levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    choice.feats.filter((taken: FeatTaken) =>
                        (excludeTemporary ? !choice.showOnSheet : true) &&
                        (
                            !featName ||
                            (includeCountAs && (taken.countAsFeat?.toLowerCase() == featName.toLowerCase() || false)) ||
                            (taken.name.toLowerCase() == featName.toLowerCase())
                        ) &&
                        (!source || (taken.source.toLowerCase() == source.toLowerCase())) &&
                        (!sourceId || (taken.sourceId == sourceId)) &&
                        ((locked == undefined && automatic == undefined) || (taken.locked == locked) || (taken.automatic == automatic))
                    ).forEach(taken => {
                        featsTaken.push(taken);
                    })
                })
            })
            return featsTaken;
        }
    }
    take_Feat(creature: Character | Familiar, characterService: CharacterService, feat: Feat, featName: string, taken: boolean, choice: FeatChoice, locked: boolean, automatic: boolean = false) {
        const levelNumber = parseInt(choice.id.split("-")[0]);
        const level: Level = creature instanceof Character ? creature.class.levels[levelNumber] : characterService.get_Level(levelNumber);
        if (taken) {
            const newLength = choice.feats.push(Object.assign(new FeatTaken(), { name: (feat?.name || featName), source: choice.source, locked: locked, automatic: automatic, sourceId: choice.id, countAsFeat: (feat?.countAsFeat || feat?.superType || "") }));
            const gain = choice.feats[newLength - 1];
            characterService.process_Feat(creature, feat, gain, choice, level, taken);
        } else {
            const choiceFeats = choice.feats;
            const gain = choiceFeats.find(existingFeat =>
                existingFeat.name == featName &&
                existingFeat.locked == locked
            )
            characterService.process_Feat(creature, feat, gain, choice, level, taken);
            choiceFeats.splice(choiceFeats.indexOf(gain, 1));
        }
    }
    get_SpellsTaken(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, spellLevel: number = -1, spellName: string = "", spellCasting: SpellCasting = undefined, className: string = "", tradition: string = "", castingType: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined, signatureAllowed: boolean = false, cantripAllowed: boolean = true): { choice: SpellChoice, gain: SpellGain }[] {
        if (this.class) {
            let spellsTaken: { choice: SpellChoice, gain: SpellGain }[] = [];
            function get_DynamicLevel(choice: SpellChoice, casting: SpellCasting, characterService: CharacterService) {
                return characterService.spellsService.get_DynamicSpellLevel(casting, choice, characterService);
            }
            function choiceLevelMatches(choice: SpellChoice) {
                return choice.charLevelAvailable >= minLevelNumber && choice.charLevelAvailable <= maxLevelNumber;
            }
            function spellLevelMatches(casting: SpellCasting, choice: SpellChoice) {
                return (
                    spellLevel == -1 ||
                    (choice.dynamicLevel ? get_DynamicLevel(choice, casting, characterService) : choice.level) == spellLevel
                );
            }
            function signatureSpellLevelMatches(choice: SpellChoice) {
                return (
                    signatureAllowed &&
                    choice.spells.some(spell => spell.signatureSpell) &&
                    ![0, -1].includes(spellLevel)
                );
            }
            function spellMatches(casting: SpellCasting, choice: SpellChoice, gain: SpellGain) {
                return (
                    (spellName ? gain.name == spellName : true) &&
                    (className ? casting.className == className : true) &&
                    (tradition ? casting.tradition == tradition : true) &&
                    (source ? choice.source == source : true) &&
                    (sourceId ? gain.sourceId == sourceId : true) &&
                    ((locked != undefined) ? gain.locked == locked : true) &&
                    ((signatureAllowed && gain.signatureSpell) ? (spellLevel >= characterService.spellsService.get_Spells(gain.name)[0]?.levelreq) : true) &&
                    (cantripAllowed || (!characterService.spellsService.get_Spells(gain.name)[0]?.traits.includes("Cantrip")))
                );
            }
            this.class.spellCasting
                .filter(casting => (spellCasting == undefined || casting === spellCasting) &&
                    casting.charLevelAvailable >= minLevelNumber && casting.charLevelAvailable <= maxLevelNumber &&
                    (casting.castingType == castingType || castingType == ""))
                .forEach(casting => {
                    casting.spellChoices.filter(choice => choiceLevelMatches(choice) && (signatureSpellLevelMatches(choice) || spellLevelMatches(casting, choice))).forEach(choice => {
                        choice.spells.filter(gain =>
                            spellMatches(casting, choice, gain)
                        ).forEach(gain => {
                            spellsTaken.push({ choice: choice, gain: gain });
                        })
                    })
                })
            //For your innate spellcasting, or for all spells, also collect innate spells gained from worn items.
            if (spellCasting == undefined || spellCasting.castingType == "Innate") {
                spellsTaken.push(...this.get_EquipmentSpellsGranted(characterService, spellLevel, spellName, source, sourceId, locked, cantripAllowed));
            }
            return spellsTaken;
        }
    }
    get_EquipmentSpellsGranted(characterService: CharacterService, spellLevel: number = -1, spellName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined, cantripAllowed: boolean = true) {
        let spellsGranted: { choice: SpellChoice, gain: SpellGain }[] = [];
        //Collect innate spells gained from worn items.
        function get_DynamicLevel(choice: SpellChoice, casting: SpellCasting, characterService: CharacterService) {
            return characterService.spellsService.get_DynamicSpellLevel(casting, choice, characterService);
        }
        function spellLevelMatches(choice: SpellChoice) {
            return (
                spellLevel == -1 ||
                (choice.dynamicLevel ? get_DynamicLevel(choice, innateSpellcasting, characterService) : choice.level) == spellLevel
            )
        }
        function spellMatches(choice: SpellChoice, gain: SpellGain) {
            return (
                (spellName ? gain.name == spellName : true) &&
                (source ? choice.source == source : true) &&
                (sourceId ? gain.sourceId == sourceId : true) &&
                ((locked != undefined) ? gain.locked == locked : true) &&
                (cantripAllowed || (!characterService.spellsService.get_Spells(gain.name)[0]?.traits.includes("Cantrip")))
            )
        }
        const innateSpellcasting = this.class.spellCasting.find(casting => casting.castingType == "Innate");
        this.inventories[0].allEquipment().filter(equipment => equipment.investedOrEquipped()).forEach(equipment => {
            equipment.gainSpells.filter(choice => spellLevelMatches(choice) && !choice.resonant).forEach(choice => {
                choice.spells.filter(gain =>
                    spellMatches(choice, gain)
                ).forEach(gain => {
                    spellsGranted.push({ choice: choice, gain: gain });
                })
            })
            if (equipment instanceof WornItem) {
                equipment.aeonStones.filter(stone => stone.gainSpells.length).forEach(stone => {
                    stone.gainSpells.filter(choice => spellLevelMatches(choice)).forEach(choice => {

                        choice.spells.filter(gain =>
                            spellMatches(choice, gain)
                        ).forEach(gain => {
                            spellsGranted.push({ choice: choice, gain: gain });
                        })
                    })
                })
            }
        })
        return spellsGranted;
    }
    take_Spell(characterService: CharacterService, spellName: string, taken: boolean, choice: SpellChoice, locked: boolean, prepared: boolean = false, borrowed: boolean = false) {
        if (taken) {
            choice.spells.push(Object.assign(new SpellGain(), { name: spellName, locked: locked, sourceId: choice.id, source: choice.source, cooldown: choice.cooldown, frequency: choice.frequency, prepared: prepared, borrowed: borrowed }));
        } else {
            let oldChoice = choice.spells.find(gain => gain.name == spellName);
            choice.spells.splice(choice.spells.indexOf(oldChoice), 1);
        }
        characterService.refreshService.set_ToChange("Character", "spellbook");
    }
    learn_Spell(spell: Spell, source: string) {
        if (!this.class?.spellBook.find(learned => learned.name == spell.name)) {
            let level: number = spell.traits.includes("Cantrip") ? 0 : spell.levelreq;
            this.class?.spellBook.push({ name: spell.name, source: source, level: level });
        }
    }
    unlearn_Spell(spell: Spell) {
        this.class.spellBook = this.class.spellBook.filter(existingSpell => existingSpell.name != spell.name);
    }
    get_SpellsLearned(name: string = "", source: string = "", level: number = -1) {
        return this.class?.spellBook.filter(learned =>
            (name ? learned.name == name : true) &&
            (source ? learned.source == source : true) &&
            (level > -1 ? learned.level == level : true)
        );
    }
    add_SpellListSpell(spellName: string, source: string, levelNumber: number) {
        this.class?.spellList.push({ name: spellName, source: source, level: levelNumber });
    }
    remove_SpellListSpell(spellName: string, source: string, levelNumber: number) {
        this.class.spellList = this.class.spellList.filter(existingSpell => !(existingSpell.name == spellName && existingSpell.source == source && existingSpell.level == levelNumber));
    }
    get_SpellListSpell(name: string = "", source: string = "", level: number = 0) {
        return this.class?.spellList.filter(learned =>
            (name ? learned.name == name : true) &&
            (source ? learned.source == source : true) &&
            (level ? learned.level >= level : true)
        );
    }
    learn_Formula(item: Item, source: string) {
        if (!this.class?.formulaBook.find(learned => learned.id == item.id)) {
            this.class?.formulaBook.push(Object.assign(new FormulaLearned(), { id: item.id, source: source }));
        }
    }
    unlearn_Formula(item: Item) {
        this.class.formulaBook = this.class.formulaBook.filter(learned => learned.id != item.id);
    }
    get_FormulasLearned(id: string = "", source: string = "") {
        return this.class?.formulaBook.filter(learned =>
            (id ? learned.id == id : true) &&
            (source ? learned.source == source : true)
        );
    }
    remove_Lore(characterService: CharacterService, source: LoreChoice) {
        //Remove the original Lore training
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            characterService.get_Character().increase_Skill(characterService, 'Lore: ' + source.loreName, false, source, true)
        }
        //Go through all levels and remove skill increases for this lore from their respective sources
        //Also remove all Skill Choices that were added for this lore (as happens with the Additional Lore and Gnome Obsession Feats).
        this.class.levels.forEach(level => {
            level.skillChoices.forEach(choice => {
                choice.increases = choice.increases.filter(increase => increase.name != 'Lore: ' + source.loreName);
            })
            level.skillChoices = level.skillChoices.filter(choice => !(choice.source == source.source && !choice.increases.some(increase => increase.name != 'Lore: ' + source.loreName)) && !choice.filter.some(filter => filter == 'Lore: ' + source.loreName));
            if (source.source == "Feat: Gnome Obsession") {
                level.skillChoices = level.skillChoices.filter(choice => !(choice.source == source.source && !choice.increases.some(increase => !increase.name.includes('Lore: '))));
            }
        });
        let loreSkill: Skill = characterService.get_Character().customSkills.find(skill => skill.name == 'Lore: ' + source.loreName);
        if (loreSkill) {
            characterService.remove_CustomSkill(loreSkill);
        }
        this.remove_LoreFeats(characterService, source.loreName);
    }
    remove_LoreFeats(characterService: CharacterService, loreName: string) {
        let loreFeats: Feat[] = [];
        //If we find any custom feat that has lorebase == "Lore: "+lorename,
        //  That feat was created when the lore was assigned, and can be removed.
        //We build our own reference array first, because otherwise the forEach-index would get messed up while we remove feats.
        loreFeats.push(...characterService.get_Character().customFeats.filter(feat => feat.lorebase == 'Lore: ' + loreName));
        if (loreFeats.length) {
            loreFeats.forEach(loreFeat => {
                characterService.remove_CustomFeat(loreFeat);
            })
        }
        characterService.refreshService.set_ToChange("Character", "skills");
        characterService.refreshService.set_ToChange("Character", "charactersheet");
    }
    add_Lore(characterService: CharacterService, source: LoreChoice) {
        //Create the skill on the character. Lore can be increased, so it's locked:false.
        characterService.add_CustomSkill('Lore: ' + source.loreName, "Skill", "Intelligence", false);
        //Create as many skill increases as the source's initialIncreases value
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            characterService.get_Character().increase_Skill(characterService, 'Lore: ' + source.loreName, true, source, true)
        }
        //The Additional Lore feat grants a skill increase on Levels 3, 7 and 15 that can only be applied to this lore.
        if (source.source == "Feat: Additional Lore") {
            this.add_SkillChoice(characterService.get_Level(3), Object.assign(new SkillChoice(), { available: 1, increases: [], filter: ['Lore: ' + source.loreName], type: "Skill", maxRank: 4, source: "Feat: Additional Lore", id: "" }))
            this.add_SkillChoice(characterService.get_Level(7), Object.assign(new SkillChoice(), { available: 1, increases: [], filter: ['Lore: ' + source.loreName], type: "Skill", maxRank: 6, source: "Feat: Additional Lore", id: "" }))
            this.add_SkillChoice(characterService.get_Level(15), Object.assign(new SkillChoice(), { available: 1, increases: [], filter: ['Lore: ' + source.loreName], type: "Skill", maxRank: 8, source: "Feat: Additional Lore", id: "" }))
        }
        //The Gnome Obsession feat grants a skill increase on Levels 2, 7 and 15 that can only be applied to this lore.
        if (source.source == "Feat: Gnome Obsession") {
            let newChoice = this.add_SkillChoice(characterService.get_Level(2), Object.assign(new SkillChoice(), { available: 0, increases: [], filter: [], type: "Skill", maxRank: 4, source: "Feat: Gnome Obsession", id: "" }));
            newChoice.increases.push({ name: 'Lore: ' + source.loreName, source: "Feat: Gnome Obsession", maxRank: 4, locked: true, sourceId: newChoice.id });
            newChoice = this.add_SkillChoice(characterService.get_Level(7), Object.assign(new SkillChoice(), { available: 0, increases: [], filter: [], type: "Skill", maxRank: 6, source: "Feat: Gnome Obsession", id: "" }))
            newChoice.increases.push({ name: 'Lore: ' + source.loreName, source: "Feat: Gnome Obsession", maxRank: 6, locked: true, sourceId: newChoice.id });
            newChoice = this.add_SkillChoice(characterService.get_Level(15), Object.assign(new SkillChoice(), { available: 0, increases: [], filter: [], type: "Skill", maxRank: 8, source: "Feat: Gnome Obsession", id: "" }))
            newChoice.increases.push({ name: 'Lore: ' + source.loreName, source: "Feat: Gnome Obsession", maxRank: 8, locked: true, sourceId: newChoice.id });
        }
        if (["Feat: Gnome Obsession", "Background"].includes(source.source)) {
            let backgroundLoreIncreases = this.get_SkillIncreases(characterService, 1, 1, '', "Background").filter(increase => increase.name.includes("Lore: ") && increase.locked);
            let gnomeObsessionLoreIncreases = this.get_SkillIncreases(characterService, 0, 20, '', "Feat: Gnome Obsession").filter(increase => increase.name.includes("Lore: ") && increase.locked);
            if (gnomeObsessionLoreIncreases.length > 0 && backgroundLoreIncreases.length > 0 && backgroundLoreIncreases.length != 4) {
                let backgroundLoreName = backgroundLoreIncreases[0].name;
                let newChoice = this.add_SkillChoice(characterService.get_Level(2), Object.assign(new SkillChoice(), { available: 0, increases: [], filter: [], type: "Skill", maxRank: 4, source: "Feat: Gnome Obsession", id: "" }));
                newChoice.increases.push({ name: backgroundLoreName, source: "Feat: Gnome Obsession", maxRank: 4, locked: true, sourceId: newChoice.id });
                newChoice = this.add_SkillChoice(characterService.get_Level(7), Object.assign(new SkillChoice(), { available: 0, increases: [], filter: [], type: "Skill", maxRank: 6, source: "Feat: Gnome Obsession", id: "" }))
                newChoice.increases.push({ name: backgroundLoreName, source: "Feat: Gnome Obsession", maxRank: 6, locked: true, sourceId: newChoice.id });
                newChoice = this.add_SkillChoice(characterService.get_Level(15), Object.assign(new SkillChoice(), { available: 0, increases: [], filter: [], type: "Skill", maxRank: 8, source: "Feat: Gnome Obsession", id: "" }))
                newChoice.increases.push({ name: backgroundLoreName, source: "Feat: Gnome Obsession", maxRank: 8, locked: true, sourceId: newChoice.id });
            }
        }
        this.add_LoreFeats(characterService, source.loreName);
    }
    add_LoreFeats(characterService: CharacterService, loreName: string) {
        //There are particular feats that need to be cloned for every individual lore skill (mainly Assurance). They are marked as lorebase==true.
        characterService.get_Feats().filter(feat => feat.lorebase == "Lore").forEach(lorebaseFeat => {
            let newLength = characterService.add_CustomFeat(lorebaseFeat);
            let newFeat = characterService.get_Character().customFeats[newLength - 1];
            newFeat.name = newFeat.name.replace('Lore', 'Lore: ' + loreName);
            newFeat.subType = newFeat.subType.replace('Lore', 'Lore: ' + loreName);
            newFeat.skillreq.forEach(requirement => {
                requirement.skill = requirement.skill.replace('Lore', 'Lore: ' + loreName);
            })
            newFeat.hints.forEach(hint => {
                hint.showon = hint.showon.replace('Lore', 'Lore: ' + loreName)
            });
            newFeat.featreq = newFeat.featreq.map(featreq => featreq.replace('Lore', 'Lore: ' + loreName));
            newFeat.lorebase = "Lore: " + loreName;
            newFeat.hide = false;
            characterService.refreshService.set_ToChange("Character", "skills");
            characterService.refreshService.set_ToChange("Character", "charactersheet");
        })
    }
    get_EffectsGenerationObjects(characterService: CharacterService): { feats: (Feat | AnimalCompanionSpecialization)[], hintSets: { hint: Hint, objectName: string }[] } {
        //Return the Character, its Feats and their Hints for effect generation.
        let feats: Feat[] = [];
        let hintSets: { hint: Hint, objectName: string }[] = [];
        characterService.get_CharacterFeatsTaken(0, this.level)
            .map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
            .filter(feat => feat && feat.have(this, characterService, this.level))
            .forEach(feat => {
                feats.push(feat);
                feat.hints?.forEach(hint => {
                    hintSets.push({ hint: hint, objectName: feat.name });
                })
            });
        return { feats: feats, hintSets: hintSets };
    }
    has_Feat(featName: string, services: { readonly characterService: CharacterService }, context: { readonly level?: number } = {}): number {
        context = Object.assign({
            level: this.level
        }, context);
        return services.characterService.get_CharacterFeatsTaken(1, context.level, featName).length;
    }
}