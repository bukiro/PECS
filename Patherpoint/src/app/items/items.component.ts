import { Component, OnInit } from '@angular/core';
import { ItemsService} from '../items.service';
import { VirtualTimeScheduler } from 'rxjs';

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.css']
})
export class ItemsComponent implements OnInit {

    public showWeapons: Boolean = false;
    public showArmor: Boolean = false;
    public showShields: Boolean = false;
    
    constructor(
        public itemsService: ItemsService
    ) { }

    toggle(type) {
        switch (type) {
            case "weapons":
                this.showWeapons = !this.showWeapons
        }
        switch (type) {
            case "armor":
                this.showArmor = !this.showArmor
        }
        switch (type) {
            case "shields":
                this.showShields = !this.showShields
        }
    }

    get_Items(key: string = "", value: string = "") {
        return this.itemsService.get_Items(key, value);
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