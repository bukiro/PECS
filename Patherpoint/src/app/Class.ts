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

export class Class {
    public readonly _className: string = this.constructor.name;
    public activities: ActivityGain[] = [];
    public ancestry: Ancestry = new Ancestry();
    public animalCompanion: AnimalCompanion = new AnimalCompanion();
    public familiar: Familiar = new Familiar();
    public background: Background = new Background();
    public spellCasting: SpellCasting[] = [];
    public customSkills: Skill[] = [];
    public deity: string = "";
    public focusPoints: number = 0;
    public heritage: Heritage = new Heritage();
    public hitPoints: number = 0;
    public levels: Level[] = [];
    public name: string = "";
    on_ChangeAncestry(characterService: CharacterService) {
        let character = characterService.get_Character();
        if (this.ancestry.name) {
            this.levels[1].abilityChoices = this.levels[1].abilityChoices.filter(availableBoost => availableBoost.source != "Ancestry")
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    let items: Equipment[] = character.inventories[0][freeItem.type].filter(item => item.name == freeItem.name);
                    if (items.length) {
                        characterService.drop_InventoryItem(character, character.inventories[0], items[0], false, true, true, freeItem.amount);
                    }
                });
            }
            this.levels.forEach(level => {
                level.featChoices.filter(choice => choice.feats.filter(feat => feat.name.includes("Adopted Ancestry")).forEach(feat => {
                    character.take_Feat(character, characterService, feat.name, false, choice, feat.locked)
                }));
            });
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        if (this.ancestry.name) {
            this.ancestry.reassign();
            this.levels[1].abilityChoices.push(...this.ancestry.abilityChoices);
            if (this.ancestry.gainItems.length) {
                this.ancestry.gainItems.forEach(freeItem => {
                    let item: Equipment = itemsService.get_Items()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                    let grantedItem = characterService.grant_InventoryItem(characterService.get_Character(), characterService.get_Character().inventories[0], item, false, false, true, freeItem.amount);
                    freeItem.id = grantedItem.id;
                });
            }
        }
    }
    on_ChangeDeity(characterService: CharacterService, deitiesService: DeitiesService, deity: string) {
        let character = characterService.get_Character();
        if (character.class.deity) {
            //In the future, remove cleric skills, spells etc.
        }
    }
    on_NewDeity(characterService: CharacterService, deitiesService: DeitiesService, deity: string) {
        let character = characterService.get_Character();
        if (character.class.deity) {
            //In the future, add cleric skills, spells etc.
        }
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
            })
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
        }
    }
    on_NewHeritage(characterService: CharacterService) {
        if (this.heritage.name) {
            let character = characterService.get_Character();
            let level = this.levels[1];
            this.heritage.reassign();
            this.ancestry.traits.push(...this.heritage.traits)
            this.ancestry.ancestries.push(...this.heritage.ancestries);
            level.featChoices.push(...this.heritage.featChoices);
            level.skillChoices.push(...this.heritage.skillChoices);
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
                character.gain_Activity(Object.assign(new ActivityGain(), {name:gainActivity, source:this.heritage.name}), 1);
            });
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
        }
    }
    on_NewBackground(characterService: CharacterService) {
        if (this.background.name) {
            let level = this.levels[1];
            let character = characterService.get_Character();
            this.background.reassign();
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