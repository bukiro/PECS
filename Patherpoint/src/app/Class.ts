import { Level } from './Level';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { Item } from './Item';

export class Class {
    constructor (
        public name: string = "",
        public levels: Level[] = [],
        public ancestry: Ancestry = new Ancestry(),
        public heritage: Heritage = new Heritage(),
        public background: Background = new Background()
    ) { }
    on_ChangeAncestry(characterService: CharacterService) {
        this.levels[1].abilityBoosts = this.levels[1].abilityBoosts.filter(boost => boost.source != "ancestry" && boost.source != "freeAncestry")
        this.levels[1].ancestryAbilityBoosts_applied = 0;
        if (this.ancestry.freeItems.length) {
            this.ancestry.freeItems.forEach(freeItem => {
                let item: Item = characterService.get_InventoryItems()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                if (item) {
                    characterService.drop_InventoryItem(item);
                }
            });            
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        this.levels[1].abilityBoosts.push(...this.ancestry.abilityBoosts);
        this.levels[1].ancestryAbilityBoosts_available = this.ancestry.abilityBoosts_available;
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
    on_ChangeBackground() {
        this.levels[1].abilityBoosts = this.levels[1].abilityBoosts.filter(boost => boost.source != "background" && boost.source != "freeBackground")
        this.levels[1].backgroundAbilityBoosts_applied = 0;
        this.levels[1].freeBackgroundAbilityBoosts_applied = 0;
    }
    on_NewBackground() {
        this.levels[1].backgroundAbilityBoosts_available = this.background.abilityBoosts_available;
        this.levels[1].freeBackgroundAbilityBoosts_available = this.background.freeAbilityBoosts_available;
    }
}