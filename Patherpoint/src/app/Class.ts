import { Level } from './Level';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { Skill } from './Skill';
import { ActivityGain } from './ActivityGain';
import { Equipment } from './Equipment';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { DeitiesService } from './deities.service';
import { SpellCasting } from './SpellCasting';
import { SpellChoice } from './SpellChoice';
import { SpellGain } from './SpellGain';
import { ItemGain } from './ItemGain';
import { SpellLearned } from './SpellLearned';
import { FormulaLearned } from './FormulaLearned';

export class Class {
    public readonly _className: string = this.constructor.name;
    public activities: ActivityGain[] = [];
    public ancestry: Ancestry = new Ancestry();
    public animalCompanion: AnimalCompanion = new AnimalCompanion();
    public background: Background = new Background();
    public customSkills: Skill[] = [];
    public deity: string = "";
    public desc: {name:string, value:string}[] = [];
    public familiar: Familiar = new Familiar();
    public focusPoints: number = 0;
    public gainItems: ItemGain[] = [];
    public heritage: Heritage = new Heritage();
    public hitPoints: number = 0;
    public languages: string[] = [];
    public levels: Level[] = [];
    public name: string = "";
    public sourceBook: string = "";
    public spellCasting: SpellCasting[] = [];
    public spellBook: SpellLearned[] = [];
    public formulaBook: FormulaLearned[] = [];
    on_ChangeClass(characterService: CharacterService) {
        let character = characterService.get_Character();
        //Of each granted Item, find the item with the stored id and drop it.
        this.gainItems.forEach((freeItem: ItemGain) => {
            if (freeItem.id) {
                character.inventories.forEach(inv => {
                    inv[freeItem.type].filter((item: Equipment) => item.id == freeItem.id).forEach(item => {
                        characterService.drop_InventoryItem(character, inv, item, false, true, true, freeItem.amount);
                        freeItem.id = "";
                    });
                })
            }
        });
        //Some feats get specially processed when taken.
        //We can't just delete these feats, but must specifically un-take them to undo their effects.
        this.levels.forEach(level => {
            level.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    character.take_Feat(character, characterService, feat.name, false, choice, false);
                });
            });
        });
        this.customSkills.forEach(skill => {
            character.customSkills = character.customSkills.filter(customSkill => customSkill.name != skill.name);
        });
    }
    on_NewClass(characterService: CharacterService, itemsService: ItemsService) {
        if (this.name) {
            let character = characterService.get_Character();
            //Grant all items and save their id in the ItemGain.
            this.gainItems.forEach((freeItem: ItemGain) => {
                let item: Equipment = itemsService.get_Items()[freeItem.type].filter((item: Equipment) => item.name == freeItem.name)[0];
                let grantedItem = characterService.grant_InventoryItem(characterService.get_Character(), characterService.get_Character().inventories[0], item, false, false, true, freeItem.amount);
                freeItem.id = grantedItem.id;
            });
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            this.levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    let count: number = 0;
                    choice.feats.forEach(feat => {
                        count++;
                        character.take_Feat(character, characterService, feat.name, true, choice, feat.locked);
                    });
                    choice.feats.splice(0, count);
                });
            });
            this.customSkills.forEach(skill => {
                character.customSkills.push(Object.assign(new Skill(), skill));
            });
        }
    }
    on_ChangeAncestry(characterService: CharacterService) {
        if (this.ancestry.name) {
            let character = characterService.get_Character();
            let level = this.levels[1];
            this.ancestry.languages.forEach(ancestryLanguage => {
                this.languages = this.languages.filter(language => language != ancestryLanguage);
                characterService.set_ToChange("Character", "general");
            });
            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source != "Ancestry")
            //Of each granted Item, find the item with the stored id and drop it.
            this.ancestry.gainItems.forEach((freeItem: ItemGain) => {
                if (freeItem.id) {
                    character.inventories.forEach(inv => {
                        inv[freeItem.type].filter((item: Equipment) => item.id == freeItem.id).forEach(item => {
                            characterService.drop_InventoryItem(character, inv, item, false, true, true, freeItem.amount);
                            freeItem.id = "";
                        });
                    })
                }
            });
            //Some feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            this.ancestry.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    character.take_Feat(character, characterService, feat.name, false, choice, false);
                });
            });
            this.levels.forEach(level => {
                //Remove all Adopted Ancestry feats
                level.featChoices.filter(choice => choice.feats.filter(feat => feat.name.includes("Adopted Ancestry")).forEach(feat => {
                    character.take_Feat(character, characterService, feat.name, false, choice, feat.locked)
                }));
            });
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        if (this.ancestry.name) {
            let character = characterService.get_Character();
            let level = this.levels[1];
            this.languages.push(...this.ancestry.languages);
            characterService.set_ToChange("Character", "general");
            level.abilityChoices.push(...this.ancestry.abilityChoices);
            level.featChoices.push(...this.heritage.featChoices);
            characterService.set_ToChange("Character", "charactersheet");
            //Grant all items and save their id in the ItemGain.
            this.ancestry.gainItems.forEach((freeItem: ItemGain) => {
                let item: Equipment = itemsService.get_Items()[freeItem.type].filter((item: Equipment) => item.name == freeItem.name)[0];
                let grantedItem = characterService.grant_InventoryItem(characterService.get_Character(), characterService.get_Character().inventories[0], item, false, false, true, freeItem.amount);
                freeItem.id = grantedItem.id;
            });
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source == "Ancestry").forEach(choice => {
                let count: number = 0;
                choice.feats.forEach(feat => {
                    count++;
                    character.take_Feat(character, characterService, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });
        }
    }
    on_ChangeDeity(characterService: CharacterService, deitiesService: DeitiesService, deity: string) {
        let character = characterService.get_Character();
        if (character.class.deity) {
            //In the future, remove cleric skills, spells etc.
        }
        characterService.set_ToChange("Character", "general");
    }
    on_NewDeity(characterService: CharacterService, deitiesService: DeitiesService, deity: string) {
        let character = characterService.get_Character();
        if (character.class.deity) {
            //In the future, add cleric skills, spells etc.
        }
        characterService.set_ToChange("Character", "general");
    }
    on_ChangeHeritage(characterService: CharacterService) {
        if (this.heritage.name) {
            let level = this.levels[1];
            let character = characterService.get_Character();
            this.heritage.ancestries.forEach(ancestryListing => {
                this.ancestry.ancestries = this.ancestry.ancestries.filter(ancestry => ancestry != ancestryListing)
            })
            this.heritage.traits.forEach(traitListing => {
                this.ancestry.traits = this.ancestry.traits.filter(trait => trait != traitListing)
                characterService.set_ToChange("Character", "general");
                characterService.set_ToChange("Character", "charactersheet");
            })
            //Of each granted Item, find the item with the stored id and drop it.
            this.heritage.gainItems.forEach((freeItem: ItemGain) => {
                if (freeItem.id) {
                    character.inventories.forEach(inv => {
                        inv[freeItem.type].filter((item: Equipment) => item.id == freeItem.id).forEach(item => {
                            characterService.drop_InventoryItem(character, inv, item, false, true, true, freeItem.amount);
                            freeItem.id = "";
                        });
                    })
                }
            });
            //Some feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            this.heritage.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    character.take_Feat(character, characterService, feat.name, false, choice, false);
                });
            });
            level.featChoices = level.featChoices.filter(choice => choice.source != "Heritage");
            level.skillChoices = level.skillChoices.filter(choice => choice.source != "Heritage" && choice.source != "Skilled Heritage");
            //Also remove the 5th level skill increase from Skilled Heritage
            this.levels[5].skillChoices = this.levels[5].skillChoices.filter(choice => choice.source != "Skilled Heritage");
            this.heritage.gainActivities.forEach((gainActivity: string) => {
                let oldGain = character.class.activities.find(gain => gain.name == gainActivity && gain.source == this.heritage.name);
                if (oldGain) {
                    character.lose_Activity(characterService, characterService.timeService, characterService.itemsService, characterService.spellsService, characterService.activitiesService, oldGain);
                }
            });
            //Gain Spell or Spell Option
            this.heritage.spellChoices.forEach(oldSpellChoice => {
                character.remove_SpellChoice(characterService, oldSpellChoice);
            });
            //Undo all Wellspring Gnome changes.
            //We collect all Gnome feats that grant a primal spell and return that spell to Primal on the character:
            if (this.heritage.name.includes("Wellspring Gnome")) {
                let feats: string[] = characterService.get_Feats("", "Gnome")
                .filter(feat => feat.gainSpellChoice.filter(choice => choice.castingType == "Innate" && choice.tradition == "Primal").length).map(feat => feat.name);
                this.spellCasting.find(casting => casting.castingType == "Innate")
                    .spellChoices.filter(choice => feats.includes(choice.source.substr(6))).forEach(choice => {
                    choice.tradition = "Primal";
                    if (choice.available) {
                        choice.spells.length = 0;
                    }
                });
            }
        }
    }
    on_NewHeritage(characterService: CharacterService, itemsService: ItemsService) {
        if (this.heritage.name) {
            let character = characterService.get_Character();
            let level = this.levels[1];
            this.ancestry.traits.push(...this.heritage.traits)
            this.ancestry.ancestries.push(...this.heritage.ancestries);
            level.featChoices.push(...this.heritage.featChoices);
            level.skillChoices.push(...this.heritage.skillChoices);
            //Grant all items and save their id in the ItemGain.
            this.heritage.gainItems.forEach((freeItem: ItemGain) => {
                let item: Equipment = itemsService.get_CleanItems()[freeItem.type].filter((item: Equipment) => item.name == freeItem.name)[0];
                let grantedItem = characterService.grant_InventoryItem(characterService.get_Character(), characterService.get_Character().inventories[0], item, false, false, true, freeItem.amount);
                freeItem.id = grantedItem.id;
            });
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source == "Heritage").forEach(choice => {
                let count: number = 0;
                choice.feats.forEach(feat => {
                    count++;
                    character.take_Feat(character, characterService, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });
            //You may get a skill training from a heritage.
            //If you have already trained this skill from another source:
            //Check if it is a free training (not locked). If so, remove it and reimburse the skill point, then replace it with the heritage's.
            //If it is locked, we better not replace it. Instead, you get a free Heritage skill increase.
            if (this.heritage.skillChoices.length && this.heritage.skillChoices[0].increases.length) {
                let existingIncreases = character.get_SkillIncreases(characterService, 1, 1, this.heritage.skillChoices[0].increases[0].name, '');
                if (existingIncreases.length) {
                    let existingIncrease = existingIncreases[0];
                    let existingSkillChoice: SkillChoice = character.get_SkillChoice(existingIncrease.sourceId);
                    if (existingSkillChoice !== this.heritage.skillChoices[0]) {
                        if (!existingIncrease.locked) {
                            character.increase_Skill(characterService, existingIncrease.name, false, existingSkillChoice, false);
                        } else {
                            this.heritage.skillChoices[0].increases.pop();
                            this.heritage.skillChoices[0].available = 1;
                        }
                    }
                }
            }
            this.heritage.gainActivities.forEach((gainActivity: string) => {
                character.gain_Activity(characterService, Object.assign(new ActivityGain(), {name:gainActivity, source:this.heritage.name}), 1);
            });
            //Gain Spell or Spell Option
            this.heritage.spellChoices.forEach(newSpellChoice => {
                let insertSpellChoice = Object.assign(new SpellChoice(), JSON.parse(JSON.stringify(newSpellChoice)));
                insertSpellChoice.spells.forEach((gain: SpellGain) => {
                    gain.sourceId = insertSpellChoice.id;
                    gain.source = insertSpellChoice.source;
                    gain.frequency = insertSpellChoice.frequency;
                    gain.cooldown = insertSpellChoice.cooldown;
                })
                character.add_SpellChoice(characterService, level, insertSpellChoice);
            });
            //Wellspring Gnome changes primal spells to another tradition.
            //We collect all Gnome feats that grant a primal spell and set that spell to the same tradition as the heritage:
            if (this.heritage.name.includes("Wellspring Gnome")) {
                let feats: string[] = characterService.get_Feats("", "Gnome")
                .filter(feat => feat.gainSpellChoice.filter(choice => choice.castingType == "Innate" && choice.tradition == "Primal").length).map(feat => feat.name);
                this.spellCasting.find(casting => casting.castingType == "Innate")
                    .spellChoices.filter(choice => feats.includes(choice.source.substr(6))).forEach(choice => {
                    choice.tradition = this.heritage.subType;
                    if (choice.available) {
                        choice.spells.length = 0;
                    }
                });
            }
        }
    }
    on_ChangeBackground(characterService: CharacterService) {
        if (this.background.name) {
            let level = this.levels[1];
            let character = characterService.get_Character();
            level.skillChoices = level.skillChoices.filter(choice => choice.source != "Background");
            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source != "Background");
            //Some feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            level.featChoices.filter(choice => choice.source == "Background").forEach(choice => {
                choice.feats.forEach(feat => {
                character.take_Feat(character, characterService, feat.name, false, choice, feat.locked);
                });
            });
            level.featChoices = level.featChoices.filter(availableBoost => availableBoost.source != "Background");
            //Remove all Lores
            let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Background");
            let oldChoice = oldChoices[oldChoices.length - 1];
            if (oldChoice.increases.length) {
                character.remove_Lore(characterService, oldChoice);
            }
            level.loreChoices = level.loreChoices.filter(choice => choice.source != "Background");
            //Process skill choices in case any custom skills need to be removed.
            this.background.skillChoices.filter(choice => choice.source == "Background").forEach(choice => {
                choice.increases.forEach(increase => {
                    character.process_Skill(characterService, increase.name, false, choice, true)
                })
            });
            
        }
    }
    on_NewBackground(characterService: CharacterService) {
        if (this.background.name) {
            let level = this.levels[1];
            let character = characterService.get_Character();
            level.abilityChoices.push(...this.background.abilityChoices);
            level.skillChoices.push(...this.background.skillChoices);
            level.featChoices.push(...this.background.featChoices);
            level.loreChoices.push(...this.background.loreChoices);
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source == "Background").forEach(choice => {
                let count: number = 0;
                choice.feats.forEach(feat => {
                    count++;
                    character.take_Feat(character, characterService, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });
            //Process the new skill choices in case any new skill needs to be created.
            level.skillChoices.filter(choice => choice.source == "Background").forEach(choice => {
                choice.increases.forEach(increase => {
                    character.process_Skill(characterService, increase.name, true, choice, true)
                })
            });
            if (this.background.loreChoices[0].loreName) {
                if (characterService.get_Skills(character, 'Lore: '+this.background.loreChoices[0].loreName).length) {
                    let increases = character.get_SkillIncreases(characterService, 1, 20, 'Lore: '+this.background.loreChoices[0].loreName).filter(increase => 
                        increase.sourceId.includes("-Lore-")
                        );
                    if (increases.length) {
                        let oldChoice = character.get_LoreChoice(increases[0].sourceId)
                        if (oldChoice.available == 1) {
                            character.remove_Lore(characterService, oldChoice);
                        }
                    }
                }
                character.add_Lore(characterService, this.background.loreChoices[0])
            }
            if (this.background.skillChoices[0].increases.length) {
                let existingIncreases = character.get_SkillIncreases(characterService, 1, 1, this.background.skillChoices[0].increases[0].name, '');
                if (existingIncreases.length) {
                    let existingIncrease = existingIncreases[0];
                    let existingSkillChoice: SkillChoice = character.get_SkillChoice(existingIncrease.sourceId);
                    //If you have already trained this skill from another source:
                    //Check if it is a free training (not locked). If so, remove it and reimburse the skill point, then replace it with the background's.
                    //If it is locked, we better not replace it. Instead, you get a free Background skill increase.
                    if (existingSkillChoice !== this.background.skillChoices[0]) {
                        if (!existingIncrease.locked) {
                            character.increase_Skill(characterService, existingIncrease.name, false, existingSkillChoice, false);
                        } else {
                            this.background.skillChoices[0].increases.pop();
                            this.background.skillChoices[0].available = 1;
                        }
                    }
                }
            }
        }
    }
}