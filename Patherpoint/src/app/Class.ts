import { Level } from './Level';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { Item } from './Item';
import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';

export class Class {
    constructor (
        public name: string = "",
        public levels: Level[] = [],
        public ancestry: Ancestry = new Ancestry(),
        public heritage: Heritage = new Heritage(),
        public background: Background = new Background(),
        public hitPoints: number = 0
    ) { }
    on_ChangeAncestry(characterService: CharacterService) {
        if (this.ancestry.name) {
            this.levels[1].abilityChoices = this.levels[1].abilityChoices.filter(availableBoost => availableBoost.source != "Ancestry")
            if (this.ancestry.freeItems.length) {
                this.ancestry.freeItems.forEach(freeItem => {
                    let items: Item[] = characterService.get_InventoryItems()[freeItem.type].filter(item => item.name == freeItem.name);
                    if (items.length) {
                        characterService.drop_InventoryItem(items[0]);
                    }
                });
            }
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        if (this.ancestry.name) {
            this.levels[1].abilityChoices.push(...this.ancestry.abilityChoices);
            if (this.ancestry.freeItems.length) {
                this.ancestry.freeItems.forEach(freeItem => {
                    let item: Item = itemsService.get_Items()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                    characterService.grant_InventoryItem(item);
                });
                
            }
        }
    }
    on_ChangeHeritage(characterService: CharacterService) {
        if (this.heritage.name) {
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
                    character.take_Feat(characterService, feat.name, false, choice, false);
                });
            });
            this.levels[1].featChoices = this.levels[1].featChoices.filter(choice => choice.source != "Heritage");
            this.levels[1].skillChoices = this.levels[1].skillChoices.filter(choice => choice.source != "Heritage" && choice.source != "Skilled Heritage");
            //Also remove the 5th level skill increase from Skilled Heritage
            this.levels[5].skillChoices = this.levels[5].skillChoices.filter(choice => choice.source != "Skilled Heritage");
        }
    }
    on_NewHeritage(characterService: CharacterService) {
        if (this.heritage.name) {
            this.ancestry.traits.push(...this.heritage.traits)
            this.ancestry.ancestries.push(...this.heritage.ancestries);
            let character = characterService.get_Character();
            this.levels[1].featChoices.push(...this.heritage.featChoices);
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            this.levels[1].featChoices.filter(choice => choice.source == "Heritage").forEach(choice => {
                choice.feats.forEach(feat => {
                    choice.feats.splice(choice.feats.indexOf(feat), 1);
                    character.take_Feat(characterService, feat.name, true, choice, feat.locked);
                });
            });
            this.levels[1].skillChoices.push(...this.heritage.skillChoices);
            //You may get a skill training from a heritage.
            //If you have already trained this skill from another source:
            //Check if it is a free training (not locked). If so, remove it and reimburse the skill point, then replace it with the heritage's.
            //If it is locked, we better not replace it. Instead, you get a free Heritage skill increase.
            if (this.heritage.skillChoices.length && this.heritage.skillChoices[0].increases.length) {
                let existingIncreases = character.get_SkillIncreases(1, 1, this.heritage.skillChoices[0].increases[0].name, '');
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
        }
    }
    on_ChangeBackground(characterService: CharacterService) {
        if (this.background.name) {
            let character = characterService.get_Character();
            this.levels[1].skillChoices = this.levels[1].skillChoices.filter(choice => choice.source != "Background");
            this.levels[1].abilityChoices = this.levels[1].abilityChoices.filter(availableBoost => availableBoost.source != "Background");
            //Some feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            this.levels[1].featChoices.filter(choice => choice.source == "Background").forEach(choice => {
                choice.feats.forEach(feat => {
                character.take_Feat(characterService, feat.name, false, choice, feat.locked);
                });
            });
            this.levels[1].featChoices = this.levels[1].featChoices.filter(availableBoost => availableBoost.source != "Background");
            //Remove all Lores
            let oldChoices: LoreChoice[] = this.levels[1].loreChoices.filter(choice => choice.source == "Background");
            let oldChoice = oldChoices[oldChoices.length - 1];
            characterService.get_Character().remove_Lore(characterService, oldChoice );
            this.levels[1].loreChoices = this.levels[1].loreChoices.filter(choice => choice.source != "Background");
        }
    }
    on_NewBackground(characterService: CharacterService) {
        if (this.background.name) {
            let character = characterService.get_Character();
            this.levels[1].abilityChoices.push(...this.background.abilityChoices);
            this.levels[1].skillChoices.push(...this.background.skillChoices);
            this.levels[1].featChoices.push(...this.background.featChoices);
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            this.levels[1].featChoices.filter(choice => choice.source == "Background").forEach(choice => {
                choice.feats.forEach(feat => {
                    choice.feats.splice(choice.feats.indexOf(feat), 1);
                    character.take_Feat(characterService, feat.name, true, choice, feat.locked);
                });
            });
            this.levels[1].loreChoices.push(...this.background.loreChoices);
            if (this.background.loreChoices[0].loreName) {
                character.add_Lore(characterService, this.background.loreChoices[0])
            }
            if (this.background.skillChoices[0].increases.length) {
                let existingIncreases = character.get_SkillIncreases(1, 1, this.background.skillChoices[0].increases[0].name, '');
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