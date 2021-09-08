import { Injectable } from '@angular/core';
import { Character } from './Character';
import { Ancestry } from './Ancestry';
import { Class } from './Class';
import { AbilityChoice } from './AbilityChoice';
import { ItemGain } from './ItemGain';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { ActivityGain } from './ActivityGain';
import { Level } from './Level';
import { FeatChoice } from './FeatChoice';
import { LoreChoice } from './LoreChoice';
import { SkillChoice } from './SkillChoice';
import { EffectGain } from './EffectGain';
import { SpellChoice } from './SpellChoice';
import { SpellCasting } from './SpellCasting';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { Skill } from './Skill';
import { WornItem } from './WornItem';
import { AdventuringGear } from './AdventuringGear';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Armor } from './Armor';
import { ArmorRune } from './ArmorRune';
import { Background } from './Background';
import { ConditionGain } from './ConditionGain';
import { Consumable } from './Consumable';
import { Feat } from './Feat';
import { FormulaChoice } from './FormulaChoice';
import { Health } from './Health';
import { HeldItem } from './HeldItem';
import { Heritage } from './Heritage';
import { ItemActivity } from './ItemActivity';
import { OtherConsumable } from './OtherConsumable';
import { OtherItem } from './OtherItem';
import { Potion } from './Potion';
import { Settings } from './Settings';
import { Shield } from './Shield';
import { SpellCast } from './SpellCast';
import { SpellGain } from './SpellGain';
import { Weapon } from './Weapon';
import { WeaponRune } from './WeaponRune';
import { ItemCollection } from './ItemCollection';
import { Speed } from './Speed';
import { Bulk } from './Bulk';
import { ItemsService } from './items.service';
import { Ammunition } from './Ammunition';
import { Item } from './Item';
import { Scroll } from './Scroll';
import { InventoryGain } from './InventoryGain';
import { Oil } from './Oil';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Savegame } from './Savegame';
import { CharacterService } from './character.service';
import { AnimalCompanionsService } from './animalcompanions.service';
import { ClassesService } from './classes.service';
import { HistoryService } from './history.service';
import { Talisman } from './Talisman';
import { AlchemicalBomb } from './AlchemicalBomb';
import { AlchemicalTool } from './AlchemicalTool';
import { Snare } from './Snare';
import { WeaponMaterial } from './WeaponMaterial';
import { ArmorMaterial } from './ArmorMaterial';
import { ShieldMaterial } from './ShieldMaterial';
import { AlchemicalPoison } from './AlchemicalPoison';
import { OtherConsumableBomb } from './OtherConsumableBomb';
import { Wand } from './Wand';
import { Equipment } from './Equipment';
import { ConfigService } from './config.service';
import { default as package_json } from '../../package.json';
import { Hint } from './Hint';

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
        private configService: ConfigService
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
        let savedCharacter = Object.assign(new Character(), JSON.parse(JSON.stringify(character)));

        //Restore a lot of data from reference objects.
        //This allows us to save a lot of data at saving by removing all data from certain objects that is the same as in their original template.

        //Apply any new settings.
        character.settings = Object.assign(new Settings, character.settings);

        //Restore Inventories.
        character.inventories = character.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));

        //Apply patches that need to be done before the class is restored.
        //This is usually removing skill increases and feat choices, which can cause issues if the class doesn't have them at the same index as the character.
        character = this.patch(savedCharacter, character, 1, characterService);

        if (character.class.name) {
            if (character.class.ancestry && character.class.ancestry.name) {
                character.class.ancestry = historyService.restore_AncestryFromSave(character.class.ancestry, this);
            }
            if (character.class.heritage && character.class.heritage.name) {
                character.class.heritage = historyService.restore_HeritageFromSave(character.class.heritage, this);
            }
            if (character.class.background && character.class.background.name) {
                character.class.background = historyService.restore_BackgroundFromSave(character.class.background, this);
            }
            if (character.class.animalCompanion) {
                if (character.class.animalCompanion.inventories) {
                    character.class.animalCompanion.inventories = character.class.animalCompanion.inventories
                        .map(inventory => Object.assign(new ItemCollection(), inventory));
                }
                if (character.class.animalCompanion?.class?.ancestry) {
                    character.class.animalCompanion.class.ancestry = animalCompanionsService.restore_AncestryFromSave(character.class.animalCompanion.class.ancestry, this);
                }
                if (character.class.animalCompanion?.class?.levels) {
                    character.class.animalCompanion.class = animalCompanionsService.restore_LevelsFromSave(character.class.animalCompanion.class, this);
                }
                if (character.class.animalCompanion.class?.specializations) {
                    character.class.animalCompanion.class.specializations = character.class.animalCompanion.class.specializations
                        .map(spec => animalCompanionsService.restore_SpecializationFromSave(spec, this));
                }
            }
            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            character.class = classesService.restore_ClassFromSave(character.class, this);
        }

        character = this.reassign(character, "", itemsService);
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

        if (stage == 1) {

            //Monks below version 1.0.2 will lose their Path to Perfection skill increases and gain the feat choices instead.
            //The matching feats will be added in stage 2.
            if (character.class.name == "Monk" && character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 2) {

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
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 3) {
                if (character.inventories.length) {
                    character.inventories.forEach(inventory => {
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
                }
            }

            //Rogues before version 1.0.3 need to rename their class choice type.
            if (character.class?.name == "Rogue" && character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 3) {
                let racketChoice = character.class?.levels?.[1]?.featChoices?.find(choice => choice.id == "1-Racket-Rogue-1") || null;
                if (racketChoice) {
                    racketChoice.id = "1-Rogue's Racket-Rogue-1";
                    racketChoice.type = "Rogue's Racket";
                }
            }

            //Some held items before version 1.0.3 have _ClassName="WornItem" and will be corrected.
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 3) {
                character.inventories.forEach(inv => {
                    inv.helditems.filter(invItem => invItem._className != "HeldItem").forEach((invItem: any) => {
                        invItem._className = "HeldItem";
                    })
                })
            }

            //Some worn items before version 1.0.4 have activities that grant innate spells. Innate spells are now granted differently, and activities do not update well, so the activities need to be removed.
            //The activity and Condition of the Bracelet of Dashing have been renamed and can be updated at this point.
            //Slotted aeon stones now reflect that information on their own, for better detection of resonant hints and effects.
            //The moddable property has changed from string to boolean and needs to be updated on all items.
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 4) {
                character.inventories?.forEach(inv => {
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
                character.inventories?.forEach(inv => {
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
            }

            //Clerics before 1.0.5 need to change many things as the class was reworked:
            //Remove the locked Divine Font feature and the related spellchoice, then add a featchoice to choose the right one.
            //Add a feat choice for Divine Skill.
            //Remove any chosen doctrine because doctrines were blank before 1.0.5 and need to be re-selected.
            //Add the Favored Weapon proficiency on level 1.
            //Remove the Focus Spellcasting that was granted by the class object.
            if (character.class?.name == "Cleric" && character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 5) {
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
            if (character.class?.name == "Cleric" && character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 6) {
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
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 6) {
                character.class?.spellCasting?.filter(casting => casting.className == "Wizard" && casting.castingType == "Prepared").forEach(casting => {
                    casting.spellBookOnly = true;
                })
            }

        }

        // STAGE 2
        //After restoring data and reassigning.

        if (stage == 2) {

            //Characters below version 1.0.1 need a Worn Tools inventory added at index 1.
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 1) {
                if (!character.inventories[1] || character.inventories[1].itemId) {
                    character.inventories.splice(1, 0, new ItemCollection(2));
                }
            }

            //Monks below version 1.0.2 have lost their Path to Perfection skill increases and now get feat choices instead.
            if (character.class.name == "Monk" && character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 2) {
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
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 3) {
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
            //They also need to add hideIfNoneAvailable to certain featChoices.
            if (character.appVersionMajor <= 1 && character.appVersion <= 1 && character.appVersionMinor < 5) {
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

        }

        return character;

    }

    classCast(obj: any, className: string) {
        //This function tries to cast an object according to the given class name.
        switch (className) {
            case "AbilityChoice": return Object.assign(new AbilityChoice(), obj);
            case "ActivityGain": return Object.assign(new ActivityGain(), obj);
            case "AdventuringGear": return Object.assign(new AdventuringGear(), obj);
            case "AlchemicalBomb": return Object.assign(new AlchemicalBomb(), obj);
            case "AlchemicalElixir": return Object.assign(new AlchemicalElixir(), obj);
            case "AlchemicalPoison": return Object.assign(new AlchemicalPoison(), obj);
            case "AlchemicalTool": return Object.assign(new AlchemicalTool(), obj);
            case "Ammunition": return Object.assign(new Ammunition(), obj);
            case "Ancestry": return Object.assign(new Ancestry(), obj);
            case "AnimalCompanion": return Object.assign(new AnimalCompanion(), obj);
            case "AnimalCompanionAncestry": return Object.assign(new AnimalCompanionAncestry(), obj);
            case "AnimalCompanionClass": return Object.assign(new AnimalCompanionClass(), obj);
            case "AnimalCompanionLevel": return Object.assign(new AnimalCompanionLevel(), obj);
            case "AnimalCompanionSpecialization": return Object.assign(new AnimalCompanionSpecialization(), obj);
            case "Armor": return Object.assign(new Armor(), obj);
            case "ArmorMaterial": return Object.assign(new ArmorMaterial(), obj);
            case "ArmorRune": return Object.assign(new ArmorRune(), obj);
            case "Background": return Object.assign(new Background(), obj);
            case "Bulk": return Object.assign(new Bulk(), obj);
            case "Character": return Object.assign(new Character(), obj);
            case "Class": return Object.assign(new Class(), obj);
            case "ConditionGain": return Object.assign(new ConditionGain(), obj);
            case "Consumable": return Object.assign(new Consumable(), obj);
            case "EffectGain": return Object.assign(new EffectGain(), obj);
            case "Equipment": return Object.assign(new Equipment(), obj);
            case "Familiar": return Object.assign(new Familiar(), obj);
            case "Feat": return Object.assign(new Feat(), obj);
            case "FeatChoice": return Object.assign(new FeatChoice(), obj);
            case "FormulaChoice": return Object.assign(new FormulaChoice(), obj);
            case "Health": return Object.assign(new Health(), obj);
            case "HeldItem": return Object.assign(new HeldItem(), obj);
            case "Heritage": return Object.assign(new Heritage(), obj);
            case "Hint": return Object.assign(new Hint(), obj);
            case "InventoryGain": return Object.assign(new InventoryGain(), obj);
            case "Item": return Object.assign(new Item(), obj);
            case "ItemActivity": return Object.assign(new ItemActivity(), obj);
            case "ItemCollection": return Object.assign(new ItemCollection(), obj);
            case "ItemGain": return Object.assign(new ItemGain(), obj);
            case "Level": return Object.assign(new Level(), obj);
            case "LoreChoice": return Object.assign(new LoreChoice(), obj);
            case "Oil": return Object.assign(new Oil(), obj);
            case "OtherConsumable": return Object.assign(new OtherConsumable(), obj);
            case "OtherConsumableBomb": return Object.assign(new OtherConsumableBomb(), obj);
            case "OtherItem": return Object.assign(new OtherItem(), obj);
            case "Potion": return Object.assign(new Potion(), obj);
            case "Scroll": return Object.assign(new Scroll(), obj);
            case "Settings": return Object.assign(new Settings(), obj);
            case "Shield": return Object.assign(new Shield(), obj);
            case "ShieldMaterial": return Object.assign(new ShieldMaterial(), obj);
            case "Skill": return Object.assign(new Skill(), obj);
            case "SkillChoice": return Object.assign(new SkillChoice(), obj);
            case "Snare": return Object.assign(new Snare(), obj);
            case "Speed": return Object.assign(new Speed(), obj);
            case "SpellCast": return Object.assign(new SpellCast(), obj);
            case "SpellCasting": return Object.assign(new SpellCasting(obj.castingType), obj);
            case "SpellChoice": return Object.assign(new SpellChoice(), obj);
            case "SpellGain": return Object.assign(new SpellGain(), obj);
            case "Talisman": return Object.assign(new Talisman(), obj);
            case "Weapon": return Object.assign(new Weapon(), obj);
            case "WeaponMaterial": return Object.assign(new WeaponMaterial(), obj);
            case "WeaponRune": return Object.assign(new WeaponRune(), obj);
            case "WornItem": return Object.assign(new WornItem(), obj);
            case "Wand": return Object.assign(new Wand(), obj);
            default: return obj;
        }
    }

    merge(target: any, source: any) {
        if (typeof source == "object" && source) {
            let output = Object.assign(new target.constructor, JSON.parse(JSON.stringify(target)))
            if (Array.isArray(source)) {
                source.forEach((obj: any, index) => {
                    if (!output[index]) {
                        Object.assign(output, { [index]: JSON.parse(JSON.stringify(source[index])) });
                    } else {
                        output[index] = this.merge(target[index], source[index]);
                    }
                });
            } else {
                Object.keys(source).forEach(key => {
                    if (typeof source === 'object') {
                        if (!(key in target))
                            Object.assign(output, { [key]: JSON.parse(JSON.stringify(source[key])) });
                        else
                            output[key] = this.merge(target[key], source[key]);
                    } else {
                        Object.assign(output, { [key]: JSON.parse(JSON.stringify(source[key])) });
                    }
                });
            }
            return output;
        } else {
            return source;
        }

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
                        //Don't cleanup the "_className" or any attributes that are in the "save" list or start with "_" (which is done further down).
                    } else if (!object.save?.includes(key) && (key != "_className") && (key.substr(0, 1) != "_")) {
                        //If the attribute has the same value as the default, delete it from the object.
                        if (JSON.stringify(object[key]) == JSON.stringify(blank[key])) {
                            delete object[key];
                        } else {
                            object[key] = this.clean(object[key], itemsService)
                        }
                        //Cleanup attributes that start with _ (except _className).
                    } else if ((key != "_className") && key.substr(0, 1) == "_") {
                        delete object[key];
                    }
                })
                //Delete the "save" list last so it can be referenced during the cleanup, but still updated when loading.
                if (object.save) {
                    delete object.save;
                }
            }
        }
        return object;
    }

    reassign(object: any, keyName: string = "", itemsService: ItemsService = null) {
        //Only objects get reassigned - if they have a _className attribute and aren't null/undefined/empty
        if (typeof object == "object" && object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: any, index) => {
                    object[index] = this.reassign(obj, keyName + "[" + index + "]", itemsService);
                });
            } else {
                //For items with a refId, merge them with their reference item if it exists.
                if (object.refId && itemsService) {
                    let libraryItem = itemsService.get_CleanItemByID(object.refId);
                    if (libraryItem) {
                        //Map the restored object onto the library object and keep the result.
                        try {
                            object = this.merge(libraryItem, object);
                            object = itemsService.cast_ItemByClassName(object, libraryItem.constructor.name);
                            //Disable any active hint effects when loading an item.
                            if (object.hints?.length) {
                                (object as Equipment).hints?.forEach(hint => {
                                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                                })
                            }
                        } catch (e) {
                            console.log("Failed reassigning item " + object.id + ": " + e)
                        }
                    }
                }
                //If the object is not cast yet, try casting it object as its _className.
                if (object._className && object.constructor.name != object._className) {
                    try {
                        object = this.classCast(object, object._className);
                    } catch (e) {
                        console.log("Failed reassigning " + keyName + ": " + e)
                    }
                }
                Object.keys(object).forEach(key => {
                    object[key] = this.reassign(object[key], key, itemsService)
                })
            }
        }
        return object;
    }

    save_Character(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService) {

        let savegame: Character = JSON.parse(JSON.stringify(character));

        let versionString: string = package_json.version;

        if (versionString) {
            savegame.appVersionMajor = parseInt(versionString.split(".")[0]) || 0;
            savegame.appVersion = parseInt(versionString.split(".")[1]) || 0;
            savegame.appVersionMinor = parseInt(versionString.split(".")[2]) || 0;
        }

        //After copying the character into the savegame, we go through all its elements and make sure that they have the correct class.

        savegame = this.reassign(savegame, "", itemsService);

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
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/listCharacters');
    }

    load_CharacterFromDB(id: string): Observable<string[]> {
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/loadCharacter/' + id);
    }

    delete_CharacterFromDB(savegame: Savegame): Observable<string[]> {
        return this.http.post<string[]>(this.configService.dbConnectionURL + '/deleteCharacter', { id: savegame.id });
    }

    save_CharacterToDB(savegame): Observable<string[]> {
        return this.http.post<string[]>(this.configService.dbConnectionURL + '/saveCharacter', savegame);
    }

    still_loading() {
        return this.loading;
    }

    initialize(characterService: CharacterService) {
        this.loading = true;
        //At this time, the save and load buttons are disabled, and we refresh the character builder and the menu bar so that the browser knows.
        characterService.set_Changed("charactersheet");
        characterService.set_Changed("top-bar");
        this.load_Characters()
            .subscribe((results: string[]) => {
                this.loader = results;
                this.finish_loading(characterService)
            }, (error) => {
                console.log('Error loading characters from database: ' + error.message);
                this.savegames = [];
                this.loadingError = true;
                this.loading = false;
                //If the character list couldn't be loaded, the save and load buttons are re-enabled (but will disable on their own because of the error).
                // We refresh the character builder and the menu bar to update the buttons.
                characterService.set_Changed("charactersheet");
                characterService.set_Changed("top-bar");
            });
    }

    finish_loading(characterService: CharacterService) {
        if (this.loader) {
            this.savegames = [];
            this.loader.forEach(savegame => {
                //Build some informational attributes on each save game description from the character's properties.
                let newLength = this.savegames.push(new Savegame());
                this.savegames[newLength - 1].id = savegame.id;
                this.savegames[newLength - 1].dbId = savegame._id || "";
                this.savegames[newLength - 1].level = savegame.level || 1;
                this.savegames[newLength - 1].name = savegame.name || "Unnamed";
                this.savegames[newLength - 1].partyName = savegame.partyName || "No Party";
                if (savegame.class) {
                    this.savegames[newLength - 1].class = savegame.class.name || "";
                    if (savegame.class.levels?.[1]?.featChoices?.length) {
                        savegame.class.levels[1].featChoices.filter(choice => choice.specialChoice && !choice.autoSelectIfPossible && choice.feats?.length == 1 && choice.available == 1 && choice.source == savegame.class.name).forEach(choice => {
                            let choiceName = choice.feats[0].name.split(":")[0];
                            if (!choiceName.includes("School") && choiceName.includes(choice.type)) {
                                choiceName = choiceName.substr(0, choiceName.length - choice.type.length - 1);
                            }
                            this.savegames[newLength - 1].classChoice = choiceName;
                        });
                    }
                    if (savegame.class.ancestry) {
                        this.savegames[newLength - 1].ancestry = savegame.class.ancestry.name || "";
                    }
                    if (savegame.class.heritage) {
                        this.savegames[newLength - 1].heritage = savegame.class.heritage.name || "";
                    }
                    if (savegame.class.animalCompanion?.class) {
                        this.savegames[newLength - 1].companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                        this.savegames[newLength - 1].companionId = savegame.class.animalCompanion.id;
                    }
                    if (savegame.class.familiar?.originClass) {
                        this.savegames[newLength - 1].familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                        this.savegames[newLength - 1].familiarId = savegame.class.familiar.id;
                    }
                }
            });

            this.loadingError = false;
            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
        //Refresh the character builder and menu bar to update the save and load buttons, now that they are enabled again.
        characterService.set_Changed("charactersheet");
        characterService.set_Changed("top-bar");
    }

}
