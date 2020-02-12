import { Component,  OnInit } from '@angular/core';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.css'],
})
export class ItemsComponent implements OnInit {

    public showWeapons: Boolean = false;
    public showArmor: Boolean = false;
    public showShields: Boolean = false;

    constructor(
        private itemsService: ItemsService,
        private traitsService: TraitsService
    ) { }

    toggle(type) {
        switch (type) {
            case "weapons":
                this.showWeapons = !this.showWeapons
                break;
            case "armor":
                this.showArmor = !this.showArmor
                break;
            case "shields":
                this.showShields = !this.showShields
                break;
        }
    }

    toggleItemsMenu(position: string = "") {
        this.itemsService.toggleItemsMenu(position);
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    grant_Item(item) {
        return this.itemsService.grant_Item(item);
    }

    still_loading() {
        return this.itemsService.still_loading();
    }

    ngOnInit() {
        this.itemsService.initialize();
    }
}