import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { Skill } from 'src/app/classes/Skill';
import { Settings } from 'src/app/classes/Settings';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { ItemsService } from 'src/app/services/items.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Savegame } from 'src/app/classes/Savegame';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { ClassesService } from 'src/app/services/classes.service';
import { HistoryService } from 'src/app/services/history.service';
import { ConfigService } from 'src/app/services/config.service';
import { default as package_json } from 'package.json';
import { Hint } from 'src/app/classes/Hint';
import { RefreshService } from 'src/app/services/refresh.service';
import { TypeService } from 'src/app/services/type.service';
import { FeatData } from 'src/app/classes/FeatData';

@Injectable({
    providedIn: 'root'
})
export class SavegameService {

    private savegames: Savegame[] = [];
    private loadingError: boolean = false;
    private loading: boolean = false;
    private loader;

    constructor(
        private http: HttpClient,
        private configService: ConfigService,
        private typeService: TypeService,
        private refreshService: RefreshService
    ) {

    }

    get_Savegames() {
        return this.savegames;
    }

    get_LoadingError() {
        return this.loadingError;
    }

    load_Character(character: Character, characterService: CharacterService, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {
        //Make a copy of the character before restoration. This will be used in patching.
        let savedCharacter = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(character)));

        //We restore a few things individually before we restore the class, allowing us to patch them before any issues would be created by new changes to the class.

        //Apply any new settings.
        character.settings = Object.assign(new Settings, character.settings);

        //Restore Inventories, but not items.
        character.inventories = character.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));

        //Apply patches that need to be done before the class is restored.
        //This is usually removing skill increases and feat choices, which can cause issues if the class doesn't have them at the same index as the character.
        character = this.patch(savedCharacter, character, 1, characterService);

        //Restore a lot of data from reference objects.
        //This allows us to save a lot of traffic at saving by removing all data from certain objects that is the unchanged from in their original template.
        if (character.class.name) {
            if (character.class.ancestry && character.class.ancestry.name) {
                character.class.ancestry = historyService.restore_AncestryFromSave(character.class.ancestry);
            }
            if (character.class.heritage && character.class.heritage.name) {
                character.class.heritage = historyService.restore_HeritageFromSave(character.class.heritage);
            }
            if (character.class.background && character.class.background.name) {
                character.class.background = historyService.restore_BackgroundFromSave(character.class.background);
            }
            if (character.class.animalCompanion) {
                if (character.class.animalCompanion?.class?.ancestry) {
                    character.class.animalCompanion.class.ancestry = animalCompanionsService.restore_AncestryFromSave(character.class.animalCompanion.class.ancestry);
                }
                if (character.class.animalCompanion?.class?.levels) {
                    character.class.animalCompanion.class = animalCompanionsService.restore_LevelsFromSave(character.class.animalCompanion.class);
                }
                if (character.class.animalCompanion.class?.specializations) {
                    character.class.animalCompanion.class.specializations = character.class.animalCompanion.class.specializations
                        .map(spec => animalCompanionsService.restore_SpecializationFromSave(spec));
                }
            }
            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            character.class = classesService.restore_ClassFromSave(character.class);
        }

        character = character.recast(this.typeService, itemsService);
        if (character['_id']) {
            delete character['_id'];
        }

        //Apply any patches that need to be done after the class is restored.
        character = this.patch(savedCharacter, character, 2, characterService);

        return character;
    }

    patch(savedCharacter: Character, character: Character, stage: number, characterService: CharacterService) {

        // STAGE 1
        //Before restoring data from class, ancestry etc.
        //If choices need to be added or removed that have already been added or removed in the class, do it here or your character's choices will get messed up.
        //The character is not reassigned at this point, so we need to be careful with assuming that an object has a property.

        const companion = character.class.animalCompanion;
        const familiar = character.class.familiar;
        const creatures = [character, companion, familiar];

        if (stage == 1) {

            //Monks below version 1.0.2 will lose their Path to Perfection skill increases and gain the feat choices instead.
            //The matching feats will be added in stage 2.
            if (character.class.name == "Monk" && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 2) {

                //Delete the feats that give you the old feature, if they.
                let oldFirstPathChoice = character.class?.levels?.[7]?.featChoices?.find(choice => choice.id == "7-Feature-Monk-0") || null;
                if (oldFirstPathChoice) {
                    oldFirstPathChoice.feats = oldFirstPathChoice.feats.filter(feat => feat.name != "Path to Perfection");
                }
                let oldThirdPathChoice = character.class?.levels?.[15]?.featChoices?.find(choice => choice.id == "15-Feature-Monk-0") || null;
                if (oldThirdPathChoice) {
                    oldThirdPathChoice.feats = oldThirdPathChoice.feats.filter(feat => feat.name != "Third Path to Perfection");
                }
                //Delete the old skill choices, if they exist.
                if (character.class?.levels?.[7]?.skillChoices?.length) {
                    character.class.levels[7].skillChoices = character.class.levels[7].skillChoices.filter(choice => choice.source != "Path to Perfection");
                }
                if (character.class?.levels?.[11]?.skillChoices?.length) {
                    character.class.levels[11].skillChoices = character.class.levels[11].skillChoices.filter(choice => choice.source != "Second Path to Perfection");
                }
                if (character.class?.levels?.[15]?.skillChoices?.length) {
                    character.class.levels[15].skillChoices = character.class.levels[15].skillChoices.filter(choice => choice.source != "Third Path to Perfection");
                }

                //Create the feat choices, if they don't exist and the level has been touched before.
                if (character.class?.levels?.[7]?.featChoices?.length) {
                    if (!character.class?.levels?.[7]?.featChoices?.some(choice => choice.id == "7-Path to Perfection-Monk-2")) {
                        let newFeatChoice = new FeatChoice();
                        newFeatChoice.available = 1;
                        newFeatChoice.filter = ["Path to Perfection"];
                        newFeatChoice.id = "7-Path to Perfection-Monk-2";
                        newFeatChoice.source = "Monk";
                        newFeatChoice.specialChoice = true;
                        newFeatChoice.type = "Path to Perfection";
                        character.class?.levels?.[7]?.featChoices.splice(2, 0, newFeatChoice)
                    }
                }
                if (character.class?.levels?.[11]?.featChoices?.length) {
                    let secondChoice = character.class?.levels?.[11]?.featChoices?.find(choice => choice.id == "11-Feature-Monk-0") || null;
                    if (secondChoice) {
                        secondChoice.type = "Second Path to Perfection";
                        secondChoice.id = "11-Second Path to Perfection-Monk-0";
                        secondChoice.specialChoice = true;
                        if (secondChoice.feats.some(feat => feat.name == "Second Path to Perfection")) {
                            secondChoice.feats.length = 0;
                            secondChoice.available = 1;
                            secondChoice.filter = ["Second Path to Perfection"];
                        }
                    }
                }
                if (character.class?.levels?.[15]?.featChoices?.length) {
                    if (!character.class?.levels?.[15]?.featChoices?.some(choice => choice.id == "15-Third Path to Perfection-Monk-2")) {
                        let newFeatChoice = new FeatChoice();
                        newFeatChoice.available = 1;
                        newFeatChoice.filter = ["Third Path to Perfection"];
                        newFeatChoice.id = "15-Third Path to Perfection-Monk-2";
                        newFeatChoice.source = "Monk";
                        newFeatChoice.specialChoice = true;
                        newFeatChoice.type = "Third Path to Perfection";
                        character.class?.levels?.[15]?.featChoices.splice(2, 0, newFeatChoice)
                    }
                }
            }

            //Characters before version 1.0.3 need their item hints reassigned.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 3) {
                creatures.forEach(creature => {
                    creature?.inventories?.forEach(inventory => {
                        Object.keys(inventory).forEach(key => {
                            if (Array.isArray(inventory[key])) {
                                inventory[key].forEach(item => {
                                    //For each inventory, for each array property, recast all hints of the listed items.
                                    if (item.hints?.length) {
                                        item.hints = item.hints.map(hint => Object.assign(new Hint(), hint));
                                    }
                                    if (item.propertyRunes?.length) {
                                        item.propertyRunes.forEach(rune => {
                                            if (rune.hints?.length) {
                                                rune.hints = rune.hints.map(hint => Object.assign(new Hint(), hint));
                                            }
                                        })
                                    }
                                    if (item.oilsApplied?.length) {
                                        item.oilsApplied.forEach(oil => {
                                            if (oil.hints?.length) {
                                                oil.hints = oil.hints.map(hint => Object.assign(new Hint(), hint));
                                            }
                                        })
                                    }
                                    if (item.material?.length) {
                                        item.material.forEach(material => {
                                            if (material.hints?.length) {
                                                material.hints = material.hints.map(hint => Object.assign(new Hint(), hint));
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    })
                })
            }

            //Rogues before version 1.0.3 need to rename their class choice type.
            if (character.class?.name == "Rogue" && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 3) {
                let racketChoice = character.class?.levels?.[1]?.featChoices?.find(choice => choice.id == "1-Racket-Rogue-1") || null;
                if (racketChoice) {
                    racketChoice.id = "1-Rogue's Racket-Rogue-1";
                    racketChoice.type = "Rogue's Racket";
                }
            }

            //Some worn items before version 1.0.4 have activities that grant innate spells. Innate spells are now granted differently, and activities do not update well, so the activities need to be removed.
            //The activity and Condition of the Bracelet of Dashing have been renamed and can be updated at this point.
            //Slotted aeon stones now reflect that information on their own, for better detection of resonant hints and effects.
            //The moddable property has changed from string to boolean and needs to be updated on all items.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 4) {
                creatures.forEach(creature => {
                    creature?.inventories?.forEach(inv => {
                        inv.wornitems?.forEach(invItem => {
                            if ([
                                "b0a0fc41-b6cc-4dba-870c-efdd0468e448",
                                "df38a8cc-49f9-41d2-97b8-101a5cf020be",
                                "462510ac-d2fc-4f29-aa7c-dcc7272ebfcf",
                                "046845de-4cb0-411a-9f6e-85a669e5e12b"
                            ].includes(invItem.refId) && invItem.activities) {
                                invItem.activities = invItem.activities.filter(activity => !(activity.castSpells.length && activity.actions == ""));
                            }
                            if (invItem.refId == "88de530a-913b-11ea-bb37-0242ac130002") {
                                invItem.activities?.forEach(activity => {
                                    activity.name = activity.name.replace("Bracelets", "Bracelet");
                                    activity.gainConditions?.forEach(gain => {
                                        gain.name = gain.name.replace("Bracelets", "Bracelet");
                                    })
                                })
                            }
                            invItem.aeonStones?.forEach(aeonStone => {
                                aeonStone.isSlottedAeonStone = true;
                            })
                            invItem.aeonStones?.filter(aeonStone => aeonStone.refId == "046845de-4cb0-411a-9f6e-85a669e5e12b" && aeonStone.activities).forEach(aeonStone => {
                                aeonStone.activities = aeonStone.activities.filter(activity => !(activity.castSpells.length && activity.actions == ""));
                            })
                        })
                    })
                })
                creatures.forEach(creature => {
                    creature?.inventories?.forEach(inv => {
                        Object.keys(inv).forEach(key => {
                            if (Array.isArray(inv[key])) {
                                inv[key].forEach(item => {
                                    if (Object.keys(item).includes("moddable")) {
                                        if (item.moddable == "-") {
                                            item.moddable = false;
                                        } else if (item.moddable != false) {
                                            item.moddable = true;
                                        }
                                    }
                                })
                            }
                        })
                    })
                })
            }

            //Clerics before 1.0.5 need to change many things as the class was reworked:
            //Remove the locked Divine Font feature and the related spellchoice, then add a featchoice to choose the right one.
            //Add a feat choice for Divine Skill.
            //Remove any chosen doctrine because doctrines were blank before 1.0.5 and need to be re-selected.
            //Add the Favored Weapon proficiency on level 1.
            //Remove the Focus Spellcasting that was granted by the class object.
            if (character.class?.name == "Cleric" && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 5) {
                //Remove Divine Font from the initial feats, if it exists.
                let divineFontfeatChoice = character.class.levels?.[1]?.featChoices?.find(choice => choice.id == "1-Feature-Cleric-0") || null;
                if (divineFontfeatChoice) {
                    divineFontfeatChoice.feats = divineFontfeatChoice.feats.filter(feat => feat.name != "Divine Font");
                }
                //Remove the selected doctrine from the doctrine feat choice, if it exists.
                let doctrineFeatChoice = character.class.levels?.[1]?.featChoices?.find(choice => choice.id == "1-Doctrine-Cleric-1") || null;
                if (doctrineFeatChoice?.feats) {
                    doctrineFeatChoice.feats = [];
                }
                //Remove the Divine Font spell choice from the initial spell choices, if it exists.
                let spellCasting = character.class.spellCasting?.find(casting => casting.className == "Cleric" && casting.castingType == "Prepared" && casting.tradition == "Divine") || null;
                if (spellCasting) {
                    spellCasting.spellChoices = spellCasting.spellChoices.filter(choice => choice.id != "8b5e3ea0-6116-4d7e-8197-a6cb787a5788");
                }
                //If it doesn't exist, add a new feat choice for the Divine Font at the third position, so it matches the position in the class object for merging.
                if (character.class.levels[1]?.featChoices && !character.class.levels[1]?.featChoices?.some(choice => choice.id == "1-Divine Font-Cleric-1")) {
                    let newChoice = new FeatChoice();
                    newChoice.available = 1;
                    newChoice.filter = ["Divine Font"];
                    newChoice.source = "Cleric";
                    newChoice.specialChoice = true;
                    newChoice.autoSelectIfPossible = true;
                    newChoice.type = "Divine Font";
                    newChoice.id = "1-Divine Font-Cleric-1";
                    character.class.levels[1].featChoices.splice(2, 0, newChoice);
                }
                //If it doesn't exist, add a new feat choice for the Divine Skill at the fourth position, so it matches the position in the class object for merging.
                if (character.class.levels[1]?.featChoices && !character.class.levels[1]?.featChoices?.some(choice => choice.id == "1-Divine Skill-Cleric-1")) {
                    let newChoice = new FeatChoice();
                    newChoice.available = 1;
                    newChoice.filter = ["Divine Skill"];
                    newChoice.source = "Cleric";
                    newChoice.specialChoice = true;
                    newChoice.autoSelectIfPossible = true;
                    newChoice.type = "Divine Skill";
                    newChoice.id = "1-Divine Skill-Cleric-1";
                    character.class.levels[1].featChoices.splice(3, 0, newChoice);
                }
                //If it doesn't exist add a skill gain for the Favored Weapon at the eighth position of the first skill choice of level 1, so it matches the class object for merging.
                if (character.class.levels[1]?.skillChoices && !character.class.levels[1]?.skillChoices?.find(choice => choice.id == "1-Any-Class-0").increases.some(increase => increase.name == "Favored Weapon")) {
                    character.class.levels[1].skillChoices.find(choice => choice.id == "1-Any-Class-0").increases.splice(7, 0, { "name": "Favored Weapon", "source": "Class", "maxRank": 2, "locked": true, "sourceId": "1-Any-Class-0" });
                }
                //Add the custom Favored Weapon skill if needed, both to the class and the character.
                if (character.class.customSkills && !character.class.customSkills.some(skill => skill.name == "Favored Weapon")) {
                    let newSkill = new Skill(undefined, "Favored Weapon", "Specific Weapon Proficiency");
                    if (character.class.customSkills.length > 1) {
                        character.class.customSkills.splice(1, 0, newSkill);
                    } else {
                        character.class.customSkills.push(newSkill);
                    }
                }
                if (character.customSkills && !character.customSkills.some(skill => skill.name == "Favored Weapon")) {
                    let newSkill = new Skill(undefined, "Favored Weapon", "Specific Weapon Proficiency");
                    character.customSkills.push(newSkill);
                }
                //Remove the deprecated Focus Spell spellcasting that came with the class object.
                if (character.class.spellCasting) {
                    character.class.spellCasting = character.class.spellCasting.filter(spellCasting => !(spellCasting.source == "Domain Spells" && spellCasting.charLevelAvailable == 0));
                }
            }

            //Clerics before 1.0.6 need to change Divine Font: Harm and Divine Font: Heal to Healing Font and Harmful Font respectively in feat choices.
            //Some feats that were taken automatically should be marked as automatic.
            if (character.class?.name == "Cleric" && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 6) {
                character.class.levels?.[1]?.featChoices?.forEach(choice => {
                    choice.feats?.forEach(taken => {
                        if (choice.autoSelectIfPossible && taken.name == "Deadly Simplicity") {
                            taken.automatic = true;
                        }
                        if (choice.autoSelectIfPossible && choice.filter.includes("Divine Skill")) {
                            taken.automatic = true;
                        }
                        if (choice.autoSelectIfPossible && choice.filter.includes("Divine Font")) {
                            if (taken.name == "Divine Font: Harm") {
                                taken.name = "Harmful Font";
                            }
                            if (taken.name == "Divine Font: Heal") {
                                taken.name = "Healing Font";
                            }
                            if (character.class.deity) {
                                if (characterService.get_Deities(character.class.deity)[0]?.divineFont.length == 1) {
                                    taken.automatic = true;
                                }
                            }
                        }
                    })
                })
            }

            //Wizards and Wizard Archetypes before 1.0.6 need to change their main spellcasting to spellBookOnly=true.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 6) {
                character.class?.spellCasting?.filter(casting => casting.className == "Wizard" && casting.castingType == "Prepared").forEach(casting => {
                    casting.spellBookOnly = true;
                })
            }

            //The feat "Arrow Snatching " needs to be changed to "Arrow Snatching" in feat choices for characters before 1.0.14.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                character.class.levels?.forEach(level => {
                    level.featChoices?.forEach(choice => {
                        choice.feats?.forEach(taken => {
                            if (taken.name == "Arrow Snatching ") {
                                taken.name = "Arrow Snatching";
                            }
                        })
                    })
                })
            }

            //Shield cover bonus has changed from number to boolean in 1.0.14. Currently existing shields need to be updated.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                creatures.forEach(creature => {
                    creature?.inventories?.forEach(inventory => {
                        inventory.shields?.forEach(shield => {
                            shield.coverbonus = shield.coverbonus ? true : false;
                        })
                    })
                })
            }

            //Several item variant groups have been consolidated into one item each in 1.0.14, with choices to represent the variants.
            // These items need to be exchanged and some changed properties deleted to facilitate the change.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                creatures.forEach(creature => {
                    creature?.inventories?.forEach(inventory => {
                        inventory.wornitems?.forEach(wornitem => {
                            //Ring of Energy Resistance
                            if (wornitem.refId == "183b8611-da90-4a2d-a2ed-19a434a1f8ba" && !wornitem.choice) {
                                wornitem.choice = "Acid";
                            }
                            if (wornitem.refId == "12f84e34-2192-479e-8077-507b04fd8d89") {
                                wornitem.refId = "183b8611-da90-4a2d-a2ed-19a434a1f8ba"
                                wornitem.choice = "Cold";
                            }
                            if (wornitem.refId == "0b079ba2-b01a-436c-ac64-a2b52865812f") {
                                wornitem.refId = "183b8611-da90-4a2d-a2ed-19a434a1f8ba"
                                wornitem.choice = "Electricity";
                            }
                            if (wornitem.refId == "524f8fcf-8e33-42df-9444-4299d5e9f06f") {
                                wornitem.refId = "183b8611-da90-4a2d-a2ed-19a434a1f8ba"
                                wornitem.choice = "Fire";
                            }
                            if (wornitem.refId == "95600cdc-03ca-4c3d-87e4-b823e7714cb9") {
                                wornitem.refId = "183b8611-da90-4a2d-a2ed-19a434a1f8ba"
                                wornitem.choice = "Sonic";
                            }
                            //Ring of Energy Resistance (Greater)
                            if (wornitem.refId == "806cb90e-d915-47ff-b049-d1a9cd625107" && !wornitem.choice) {
                                wornitem.choice = "Acid";
                            }
                            if (wornitem.refId == "0dbb3f58-41be-4b0c-9da6-ac853877fe57") {
                                wornitem.refId = "806cb90e-d915-47ff-b049-d1a9cd625107"
                                wornitem.choice = "Cold";
                            }
                            if (wornitem.refId == "5722eead-6f13-434f-a792-8e6384e5265d") {
                                wornitem.refId = "806cb90e-d915-47ff-b049-d1a9cd625107"
                                wornitem.choice = "Electricity";
                            }
                            if (wornitem.refId == "87c0a3b2-0a28-4f6e-822b-3a70c393c962") {
                                wornitem.refId = "806cb90e-d915-47ff-b049-d1a9cd625107"
                                wornitem.choice = "Fire";
                            }
                            if (wornitem.refId == "970d5882-2c86-40fb-9d55-3d98bd829020") {
                                wornitem.refId = "806cb90e-d915-47ff-b049-d1a9cd625107"
                                wornitem.choice = "Sonic";
                            }
                            //Ring of Energy Resistance (Major)
                            if (wornitem.refId == "c423fb02-a4dd-4fcf-8b15-70d46d719b60" && !wornitem.choice) {
                                wornitem.choice = "Acid";
                            }
                            if (wornitem.refId == "95398fbc-2f7f-4de5-adf2-a3da9413ab95") {
                                wornitem.refId = "c423fb02-a4dd-4fcf-8b15-70d46d719b60"
                                wornitem.choice = "Cold";
                            }
                            if (wornitem.refId == "c4727cc4-28b5-4d7a-b4ea-854b97de2542") {
                                wornitem.refId = "c423fb02-a4dd-4fcf-8b15-70d46d719b60"
                                wornitem.choice = "Electricity";
                            }
                            if (wornitem.refId == "99b02a8a-b3ce-44ee-be45-8cfcf1a2835b") {
                                wornitem.refId = "c423fb02-a4dd-4fcf-8b15-70d46d719b60"
                                wornitem.choice = "Fire";
                            }
                            if (wornitem.refId == "5144f481-8875-436e-ad42-48b53ac93e08") {
                                wornitem.refId = "c423fb02-a4dd-4fcf-8b15-70d46d719b60"
                                wornitem.choice = "Sonic";
                            }
                        })
                    })
                })
            }
        }

        // STAGE 2
        //After restoring data and reassigning.

        if (stage == 2) {

            //Characters below version 1.0.1 need a Worn Tools inventory added at index 1.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 1) {
                if (!character.inventories[1] || character.inventories[1].itemId) {
                    character.inventories.splice(1, 0, new ItemCollection(2));
                }
            }

            //Monks below version 1.0.2 have lost their Path to Perfection skill increases and now get feat choices instead.
            if (character.class.name == "Monk" && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 2) {
                //Get the original choices back from the savedCharacter.
                let firstPath: string = savedCharacter.class?.levels?.[7]?.skillChoices?.find(choice => choice.source == "Path to Perfection")?.increases?.[0]?.name || "";
                let secondPath: string = savedCharacter.class?.levels?.[11]?.skillChoices?.find(choice => choice.source == "Second Path to Perfection")?.increases?.[0]?.name || "";
                let thirdPath: string = savedCharacter.class?.levels?.[15]?.skillChoices?.find(choice => choice.source == "Third Path to Perfection")?.increases?.[0]?.name || "";

                if (firstPath) {
                    let firstPathChoice = character.class?.levels?.[7]?.featChoices?.find(choice => choice.id == "7-Path to Perfection-Monk-2") || null;
                    if (!firstPathChoice?.feats.length) {
                        let firstPathFeat = characterService.get_Feats("Path to Perfection: " + firstPath)[0];
                        if (firstPathFeat) {
                            character.take_Feat(character, characterService, firstPathFeat, firstPathFeat.name, true, firstPathChoice, false);
                        }
                    }
                }
                if (secondPath) {
                    let secondChoice = character.class?.levels?.[11]?.featChoices?.find(choice => choice.id == "11-Second Path to Perfection-Monk-0") || null;
                    if (!secondChoice?.feats.length) {
                        let secondPathFeat = characterService.get_Feats("Second Path to Perfection: " + secondPath)[0];
                        if (secondPathFeat) {
                            character.take_Feat(character, characterService, secondPathFeat, secondPathFeat.name, true, secondChoice, false);
                        }
                    }
                }
                if (thirdPath) {
                    let thirdPathChoice = character.class?.levels?.[15]?.featChoices?.find(choice => choice.id == "15-Third Path to Perfection-Monk-2") || null;
                    if (!thirdPathChoice?.feats.length) {
                        let thirdPathFeat = characterService.get_Feats("Third Path to Perfection: " + thirdPath)[0];
                        if (thirdPathFeat) {
                            character.take_Feat(character, characterService, thirdPathFeat, thirdPathFeat.name, true, thirdPathChoice, false);
                        }
                    }
                }
            }

            //Characters with Druid dedication before version 1.0.3 need to change their Druidic Order choice type and ID, since these were renamed.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 3) {
                character.class.levels.forEach(level => {
                    let choice = level.featChoices.find(choice => choice.specialChoice && choice.type == "Order" && choice.source == "Feat: Druid Dedication");
                    if (choice) {
                        choice.type = "Druidic Order";
                        choice.id = choice.id.replace("-Order-", "-Druidic Order-");
                        choice.feats.forEach(feat => {
                            feat.sourceId = feat.sourceId.replace("-Order-", "-Druidic Order-");
                        })
                    }
                })
            }

            //Characters before version 1.0.5 need to update certain spell choices to have a dynamicAvailable value.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 5) {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        if (
                            ["Feat: Basic Wizard Spellcasting", "Feat: Expert Wizard Spellcasting", "Feat: Master Wizard Spellcasting"].includes(choice.source)
                        ) {
                            choice.dynamicAvailable = "(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat('Arcane Breadth'), 0)"
                        } else if (
                            ["Feat: Basic Bard Spellcasting", "Feat: Expert Bard Spellcasting", "Feat: Master Bard Spellcasting"].includes(choice.source)
                        ) {
                            choice.dynamicAvailable = "(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat('Occult Breadth'), 0)"
                        } else if (
                            ["Feat: Basic Druid Spellcasting", "Feat: Expert Druid Spellcasting", "Feat: Master Druid Spellcasting"].includes(choice.source)
                        ) {
                            choice.dynamicAvailable = "(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat('Primal Breadth'), 0)"
                        } else if (
                            ["Feat: Basic Sorcerer Spellcasting", "Feat: Expert Sorcerer Spellcasting", "Feat: Master Sorcerer Spellcasting"].includes(choice.source)
                        ) {
                            choice.dynamicAvailable = "(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat('Bloodline Breadth'), 0)"
                        }
                    })
                })
                character.class.levels.forEach(level => {
                    level.featChoices.filter(choice => ["Feat: Raging Intimidation", "Feat: Instinct Ability"].includes(choice.source) || choice.filter?.[0] == "Divine Skill").forEach(choice => {
                        choice.autoSelectIfPossible = true;
                        choice.feats?.forEach(taken => {
                            if (!taken.name.includes("Bestial Rage") && !taken.name.includes("Draconic Rage")) {
                                taken.automatic = true;
                            }
                        })
                    })
                })
            }

            //Feats do not have data after 1.0.12, so all custom feats' data has to be moved to class.featData. These custom feats can be removed afterwards.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 12) {
                let baseFeats = characterService.get_Feats().filter(feat => feat.lorebase || feat.weaponfeatbase).map(feat => feat.name.toLowerCase());
                characterService.featsService.build_CharacterFeats(character);
                //Only proceed with feats that were not generated from lore or weapon feat bases, and that have data.
                character.customFeats.filter(feat => !baseFeats.includes(feat.name.toLowerCase()) && feat["data"] && Object.keys(feat["data"]).length).forEach(feat => {
                    //For each time you have this feat (should be exactly one), add its data to the class object.
                    characterService.featsService.get_CharacterFeatsTakenWithLevel(0, 0, feat.name, "", "", undefined, false, false).forEach(taken => {
                        let newLength = character.class.featData.push(new FeatData(taken.level, feat.name, taken.gain.sourceId));
                        character.class.featData[newLength - 1].data = JSON.parse(JSON.stringify(feat["data"]));
                    })
                    //Mark the feat to delete.
                    feat.name = "DELETE THIS";
                })
                character.customFeats = character.customFeats.filter(feat => feat.name != "DELETE THIS");
            }

            //Archetype spell choices before 1.0.13 may include a bug concerning the related "... Breadth" feat, where the top 3 spell levels are excluded instead of the top 2.
            //From the way that spell choices are saved, this needs to be patched on the character.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 13) {
                character.class.spellCasting.forEach(casting => {
                    casting.spellChoices.filter(choice => choice.dynamicAvailable.includes("Breadth") && choice.dynamicAvailable.includes("(choice.level >= Highest_Spell_Level() - 2)")).forEach(choice => {
                        choice.dynamicAvailable = choice.dynamicAvailable.replace("choice.level >= Highest_Spell_Level()", "choice.level > Highest_Spell_Level()");
                    })
                })
            }

            //Mage Armor and Shield no longer grant items in 1.0.14. Currently existing Mage Armor and Shield items need to be removed.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                const mageArmorIDs: string[] = [
                    "b936f378-1fcb-4d29-a4b8-57cbe0dab245",
                    "5571d980-072e-40df-8228-bbce52245fe5",
                    "b2838fa8-a5b4-11ea-bb37-0242ac130002",
                    "b2839412-a5b4-11ea-bb37-0242ac130002",
                    "b2839548-a5b4-11ea-bb37-0242ac130002"
                ];
                const shieldIDs: string[] = [
                    "5dd7c22d-fc9f-4bae-b5ca-258856007a77",
                    "87f26afe-736c-4b5b-abcf-19da9014940d",
                    "e0caa889-6183-4b31-b78f-49d33c7fcbb1",
                    "7eee99d1-9b3e-41f6-9d4b-2e167242b00f",
                    "3070634b-bfbe-44e8-b12e-2e5a8fd085c2"
                ];
                creatures.forEach(creature => {
                    creature?.inventories?.forEach(inventory => {
                        inventory.armors.filter(armor => mageArmorIDs.includes(armor.refId)).forEach(armor => {
                            characterService.drop_InventoryItem(creature, inventory, armor, false, true);
                        })
                        inventory.shields.filter(shield => shieldIDs.includes(shield.refId)).forEach(shield => {
                            characterService.drop_InventoryItem(creature, inventory, shield, false, true);
                        })
                    })
                })
            }

            //Conditions from feats are tagged with fromFeat starting in 1.0.14. Currently existing condition gains on the character need to be updated.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                character.conditions.filter(gain => gain.source.includes("Feat: ")).forEach(gain => {
                    gain.fromFeat = true;
                })
            }

            //Apparently, Wizard spellcasting wasn't updated to being spellbook-only. This is amended in 1.0.14.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                character.class.spellCasting.filter(casting => casting.className == "Wizard" && casting.castingType == "Prepared").forEach(casting => { casting.spellBookOnly = true });
            }

            //The feats "Deflect Arrows" and "Quick Climber" are corrected to "Deflect Arrow" and "Quick Climb" in 1.0.14.
            if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
                character.class.levels?.forEach(level => {
                    level.featChoices?.forEach(choice => {
                        choice.feats?.forEach(taken => {
                            if (taken.name == "Deflect Arrows") {
                                taken.name = "Deflect Arrow";
                            } else if (taken.name == "Quick Climber") {
                                taken.name = "Quick Climb";
                            }
                        })
                    })
                })
                character.class?.activities?.forEach(gain => {
                    if (gain.name == "Deflect Arrows") {
                        gain.name = "Deflect Arrow";
                    }
                })
                character.conditions?.forEach(gain => {
                    if (gain.name == "Deflect Arrows") {
                        gain.name = "Deflect Arrow";
                    }
                })
            }

        }

        return character;

    }

    clean(object: any, itemsService: ItemsService) {
        //Only cleanup objects that have Classes (= aren't object Object)
        if (typeof object == "object" && object.constructor !== Object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: any) => {
                    obj = this.clean(obj, itemsService);
                });
            } else {
                let blank;
                //For items with a refId, don't compare them with blank items, but with their reference item if it exists.
                //If none can be found, the reference item is a blank item of the same class.
                if (object.refId) {
                    blank = itemsService.get_CleanItemByID(object.refId);
                }
                if (!blank) {
                    blank = new object.constructor();
                }
                Object.keys(object).forEach(key => {
                    //Delete attributes that are in the "neversave" list, if it exists.
                    if (object.neversave?.includes(key)) {
                        delete object[key];
                        //Don't cleanup the neversave list, the save list, any attributes that are in the save list, or any that start with "_" (which is done further down).
                    } else if (key != "save" && key != "neversave" && !object.save?.includes(key) && (key.substr(0, 1) != "_")) {
                        //If the attribute has the same value as the default, delete it from the object.
                        if (JSON.stringify(object[key]) == JSON.stringify(blank[key])) {
                            delete object[key];
                        } else {
                            object[key] = this.clean(object[key], itemsService)
                        }
                        //Cleanup attributes that start with _.
                    } else if (key.substr(0, 1) == "_") {
                        delete object[key];
                    }
                })
                //Delete the "save" and "neversave" lists last so they can be referenced during the cleanup, but still updated when loading.
                if (object.save) {
                    delete object.save;
                }
                if (object.neversave) {
                    delete object.neversave;
                }
            }
        }
        return object;
    }

    save_Character(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {

        //Copy the character into a savegame, then go through all its elements and make sure that they have the correct class.
        let savegame: Character = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(character))).recast(this.typeService, itemsService);

        let versionString: string = package_json.version;

        if (versionString) {
            savegame.appVersionMajor = parseInt(versionString.split(".")[0]) || 0;
            savegame.appVersion = parseInt(versionString.split(".")[1]) || 0;
            savegame.appVersionMinor = parseInt(versionString.split(".")[2]) || 0;
        }

        //Go through all the items, class, ancestry, heritage, background and compare every element to its library equivalent, skipping the properties listed in .save
        //Everything that is the same as the library item gets deleted.
        if (savegame.class.name) {
            savegame.class = classesService.clean_ClassForSave(savegame.class);
            if (savegame.class.ancestry?.name) {
                savegame.class.ancestry = historyService.clean_AncestryForSave(savegame.class.ancestry);
            }
            if (savegame.class.heritage?.name) {
                savegame.class.heritage = historyService.clean_HeritageForSave(savegame.class.heritage);
            }
            if (savegame.class.background?.name) {
                savegame.class.background = historyService.clean_BackgroundForSave(savegame.class.background);
            }
            if (savegame.class.animalCompanion) {
                if (savegame.class.animalCompanion.class?.ancestry) {
                    savegame.class.animalCompanion.class.ancestry = animalCompanionsService.clean_AncestryForSave(savegame.class.animalCompanion.class.ancestry);
                }
                if (savegame.class.animalCompanion.class?.levels) {
                    savegame.class.animalCompanion.class = animalCompanionsService.clean_LevelsForSave(savegame.class.animalCompanion.class);
                }
                if (savegame.class.animalCompanion.class?.specializations) {
                    savegame.class.animalCompanion.class.specializations.forEach(spec => {
                        spec = animalCompanionsService.clean_SpecializationForSave(spec);
                    })
                }
            }
        }

        savegame.GMMode = false;

        //Then go through the whole thing again and compare every object to its Class's default, deleting everything that has the same value as the default.
        savegame = this.clean(savegame, itemsService);

        return this.save_CharacterToDB(savegame);

    }

    load_Characters(): Observable<string[]> {
        return this.http.get<string[]>(this.configService.get_DBConnectionURL() + '/listCharacters', { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    load_CharacterFromDB(id: string): Observable<string[]> {
        return this.http.get<string[]>(this.configService.get_DBConnectionURL() + '/loadCharacter/' + id, { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    delete_CharacterFromDB(savegame: Savegame): Observable<string[]> {
        return this.http.post<string[]>(this.configService.get_DBConnectionURL() + '/deleteCharacter', { id: savegame.id }, { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    save_CharacterToDB(savegame): Observable<string[]> {
        return this.http.post<string[]>(this.configService.get_DBConnectionURL() + '/saveCharacter', savegame, { headers: new HttpHeaders({ 'x-access-Token': this.configService.get_XAccessToken() }) });
    }

    still_loading() {
        return this.loading;
    }

    initialize(characterService: CharacterService) {
        this.loading = true;
        //At this time, the save and load buttons are disabled, and we refresh the character builder and the menu bar so that the browser knows.
        this.refreshService.set_Changed("charactersheet");
        this.refreshService.set_Changed("top-bar");
        if (this.configService.get_HasDBConnectionURL() && this.configService.get_LoggedIn()) {
            const loadSubscription = this.load_Characters()
                .subscribe((results: string[]) => {
                    this.loader = results;
                    this.finish_loading(characterService)
                }, (error) => {
                    if (error.status == 401) {
                        this.configService.on_LoggedOut("Your login is no longer valid.");
                    } else {
                        console.log('Error loading characters from database: ' + error.message);
                        this.savegames = [];
                        this.loadingError = true;
                        this.loading = false;
                        //If the character list couldn't be loaded, the save and load buttons are re-enabled (but will disable on their own because of the error).
                        // We refresh the character builder and the menu bar to update the buttons.
                        this.refreshService.set_Changed("charactersheet");
                        this.refreshService.set_Changed("top-bar");
                        this.refreshService.set_Changed();
                    }
                }, () => {
                    loadSubscription.unsubscribe();
                });
        } else {
            this.loading = false;
            this.loadingError = true;
            this.savegames = [];
        }
    }

    finish_loading(characterService: CharacterService) {
        if (this.loader) {
            this.savegames = [];
            this.loader.forEach(savegame => {
                //Build some informational attributes on each save game description from the character's properties.
                let newLength = this.savegames.push(new Savegame());
                let newSavegame = this.savegames[newLength - 1];
                newSavegame.id = savegame.id;
                newSavegame.dbId = savegame._id || "";
                newSavegame.level = savegame.level || 1;
                newSavegame.name = savegame.name || "Unnamed";
                newSavegame.partyName = savegame.partyName || "No Party";
                if (savegame.class) {
                    newSavegame.class = savegame.class.name || "";
                    if (savegame.class.levels?.[1]?.featChoices?.length) {
                        savegame.class.levels[1].featChoices.filter(choice => choice.specialChoice && !choice.autoSelectIfPossible && choice.feats?.length == 1 && choice.available == 1 && choice.source == savegame.class.name).forEach(choice => {
                            let choiceName = choice.feats[0].name.split(":")[0];
                            if (!choiceName.includes("School") && choiceName.includes(choice.type)) {
                                choiceName = choiceName.substr(0, choiceName.length - choice.type.length - 1);
                            }
                            newSavegame.classChoice = choiceName;
                        });
                    }
                    if (savegame.class.ancestry) {
                        newSavegame.ancestry = savegame.class.ancestry.name || "";
                    }
                    if (savegame.class.heritage) {
                        newSavegame.heritage = savegame.class.heritage.name || "";
                    }
                    if (savegame.class.animalCompanion?.class) {
                        newSavegame.companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                        newSavegame.companionId = savegame.class.animalCompanion.id;
                    }
                    if (savegame.class.familiar?.originClass) {
                        newSavegame.familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                        newSavegame.familiarId = savegame.class.familiar.id;
                    }
                }
            });

            this.loadingError = false;
            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
        //Refresh the character builder and menu bar to update the save and load buttons, now that they are enabled again.
        this.refreshService.set_Changed("charactersheet");
        this.refreshService.set_Changed("top-bar");
        //Also update the charactersheet that the character builder is attached to, so it is properly displayed after loading the page.
        this.refreshService.set_Changed("character-sheet");
    }

}
