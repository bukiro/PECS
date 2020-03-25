import { Component,  OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { ItemCollection } from '../ItemCollection';
import { Consumable } from '../Consumable';
import { Item } from '../Item';

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit {

    private showList: string = "";
    private showItem: number = 0;
    private id: number = 0;
    public hover: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private itemsService: ItemsService,
        private characterService: CharacterService
    ) { }

    toggle_List(type) {
        if (this.showList == type) {
            this.showList = "";
        } else {
            this.showList = type;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    get_Accent(hover: number = -1) {
        return this.characterService.get_Accent(hover == this.hover);
    }

    toggle_Item(id: number) {
        if (this.showItem == id) {
            this.showItem = 0;
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    toggleItemsMenu() {
        this.characterService.toggleMenu("items");
    }

    get_Items() {
        this.id = 0;
        return this.itemsService.get_Items();
    }

    get_VisibleItems(items) {
        return items.filter(item => !item.hide);
    }

    grant_Item(item) {
        this.characterService.grant_InventoryItem(item);
        this.characterService.set_Changed();
    }

    still_loading() {
        return this.itemsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }
}