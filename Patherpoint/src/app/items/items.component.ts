import { Component,  OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';

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
        private traitsService: TraitsService,
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

    get_Items(type: string) {
        let items = this.itemsService.get_Items();
        switch (type) {
            case "Weapons":
                this.id = 1000;
                return items.weapons.filter(item => !item.hide);
            case "Armor":
                this.id = 2000;
                return items.armors.filter(item => !item.hide);
            case "Shields":
                this.id = 3000;
                return items.shields.filter(item => !item.hide);
            case "Worn Items":
                this.id = 4000;
                return items.wornitems;
            case "Alchemical Elixirs":
                this.id = 5000;
                return items.alchemicalelixirs;
        }
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Price(item) {
        if (item.price) {
            if (item.price == "-") {
                return "-";
            } else {
                let price: number = parseInt(item.price);
                let priceString: string = "";
                if (price >= 100) {
                    priceString += Math.floor(price / 100)+"gp ";
                    price %= 100;
                }
                if (price >= 10) {
                    priceString += Math.floor(price / 10)+"sp ";
                    price %= 10;
                }
                if (price >= 1) {
                    priceString += price+"cp";
                }
                return priceString;
            }
        } else {
            return "-"
        }
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