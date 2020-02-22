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
        public background: Background = new Background()
    ) { }
    on_ChangeAncestry(characterService: CharacterService) {
        if (this.ancestry.name)
        {
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
        this.levels[1].abilityChoices.push(...this.ancestry.abilityChoices);
        if (this.ancestry.freeItems.length) {
            this.ancestry.freeItems.forEach(freeItem => {
                let item: Item = itemsService.get_Items()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                characterService.grant_InventoryItem(item);
            });
            
        }
    }
    on_ChangeHeritage() {

    }
    on_NewHeritage() {

    }
    on_ChangeBackground(characterService: CharacterService) {
        if (this.background.name)
        {
            this.levels[1].skillChoices = this.levels[1].skillChoices.filter(choice => choice.source != "Background");
            this.levels[1].abilityChoices = this.levels[1].abilityChoices.filter(availableBoost => availableBoost.source != "Background");
            if (this.background.loreName || this.background.specialLore) {
                let oldChoices: LoreChoice[] = this.levels[1].loreChoices.filter(choice => choice.source == "Background");
                let oldChoice = oldChoices[oldChoices.length - 1];
                characterService.get_Character().remove_Lore(characterService, this.levels[1], oldChoice );
            }
            this.levels[1].loreChoices = this.levels[1].loreChoices.filter(choice => choice.source != "Background");
        }
    }
    on_NewBackground(characterService: CharacterService) {
        let character = characterService.get_Character();
        this.levels[1].abilityChoices.push(...this.background.abilityChoices);
        if (this.background.skill) {
            //If the background grants a skill training, buy you have already trained this skill:
            //Check if it is a free training (not locked). If so, remove it and reimburse the skill point, then replace it with the background's.
            //If it is locked, we better not replace it. Instead, you get a free Background skill increase.
            let existingIncreases = characterService.get_Character().get_SkillIncreases(1, 1, this.background.skill, '');
            if (existingIncreases.length) {
                let existingIncrease = existingIncreases[0];
                if (!existingIncrease.locked) {
                    let existingSkillChoice: SkillChoice = characterService.get_Character().get_SkillIncreaseSource(this.levels[1], existingIncrease);
                    characterService.get_Character().increase_Skill(characterService, existingIncrease.name, false, existingSkillChoice, false);
                    let newSkillChoice = characterService.get_Character().add_SkillChoice(this.levels[1], {available:0, increases:[], type:"Skill", maxRank:2, source:'Background', id:0});
                    characterService.get_Character().increase_Skill(characterService, this.background.skill, true, newSkillChoice, true)
                } else {
                    characterService.get_Character().add_SkillChoice(this.levels[1], {available:1, increases:[], type:"Skill", maxRank:2, source:'Background', id:0})
                }
            } else {
                let newSkillChoice = characterService.get_Character().add_SkillChoice(this.levels[1], {available:0, increases:[], type:"Skill", maxRank:2, source:'Background', id:0});
                characterService.get_Character().increase_Skill(characterService, this.background.skill, true, newSkillChoice, true)
            }
        }
        if (this.background.loreName) {
                let newLoreChoice = characterService.get_Character().add_LoreChoice(this.levels[1], {available:0, increases:[], loreName:this.background.loreName, loreDesc:"", source:'Background', id:0});
                character.add_Lore(characterService, this.levels[1], newLoreChoice);
        }
        if (this.background.specialLore) {
            characterService.get_Character().add_LoreChoice(this.levels[1], {available:1, increases:[], loreName:"", loreDesc:this.background.specialLore, source:'Background', id:0})
        }
    }
    
}