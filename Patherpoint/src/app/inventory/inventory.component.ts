import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {

    constructor(
        public characterService: CharacterService,
        public itemsService: ItemsService
    ) { }

    still_loading() {
        return this.characterService.still_loading();
    }

    toggleItemsMenu() {
        this.itemsService.toggleItemsMenu();
    }

    get_InventoryItems(key:string = "", value:string = "") {
        return this.characterService.get_InventoryItems(key, value);
    }
    
    drop_InventoryItem(item) {
        this.characterService.drop_InventoryItem(item);
    }

    onChange(item) {
        this.characterService.onEquipChange(item);
    }

    ngOnInit() {
    }

}
