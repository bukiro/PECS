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
        if (this.background.name) {
            this.levels[1].skillChoices = this.levels[1].skillChoices.filter(choice => choice.source != "Background");
            this.levels[1].abilityChoices = this.levels[1].abilityChoices.filter(availableBoost => availableBoost.source != "Background");
            if (this.background.loreName || this.background.specialLore) {
                let oldChoices: LoreChoice[] = this.levels[1].loreChoices.filter(choice => choice.source == "Background");
                let oldChoice = oldChoices[oldChoices.length - 1];
                characterService.get_Character().remove_Lore(characterService, oldChoice );
            }
            this.levels[1].loreChoices = this.levels[1].loreChoices.filter(choice => choice.source != "Background");
        }
    }
    on_NewBackground(characterService: CharacterService) {
        if (this.background.name) {
            let character = characterService.get_Character();
            this.levels[1].abilityChoices.push(...this.background.abilityChoices);
            this.levels[1].skillChoices.push(...this.background.skillChoices);
            this.levels[1].loreChoices.push(...this.background.loreChoices);
            if (this.background.loreChoices[0].loreName) {
                characterService.add_CustomSkill('Lore: '+this.background.loreChoices[0].loreName, "Skill", "Intelligence");
                characterService.get_Feats().filter(feat => feat.lorebase).forEach(lorebase =>{
                    let newLength = characterService.add_CustomFeat(lorebase);
                    let newFeat = characterService.get_Character().customFeats[newLength -1];
                    newFeat.name = newFeat.name.replace('Lore', 'Lore: '+this.background.loreChoices[0].loreName);
                    newFeat.skillreq = newFeat.skillreq.replace('Lore', 'Lore: '+this.background.loreChoices[0].loreName);
                    newFeat.showon = newFeat.showon.replace('Lore', 'Lore: '+this.background.loreChoices[0].loreName);
                    newFeat.featreq = newFeat.featreq.replace('Lore', 'Lore: '+this.background.loreChoices[0].loreName);
                    newFeat.lorebase = false;
                })
            }
            let existingIncreases = character.get_SkillIncreases(1, 1, this.background.skillChoices[0].increases[0].name, '');
            if (existingIncreases.length) {
                let existingIncrease = existingIncreases[0];
                let existingSkillChoice: SkillChoice = character.get_SkillIncreaseSource(this.levels[1], existingIncrease);
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