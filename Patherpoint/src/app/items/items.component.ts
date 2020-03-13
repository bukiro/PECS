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

    public showWeapons: Boolean = false;
    public showArmors: Boolean = false;
    public showShields: Boolean = false;
    public showWornItems: Boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private itemsService: ItemsService,
        private traitsService: TraitsService,
        private characterService: CharacterService
    ) { }

    toggle(type) {
        switch (type) {
            case "weapons":
                this.showWeapons = !this.showWeapons
                break;
            case "armors":
                this.showArmors = !this.showArmors
                break;
            case "shields":
                this.showShields = !this.showShields
                break;
            case "wornitems":
                this.showWornItems = !this.showWornItems
                break;
        }
    }

    toggleItemsMenu() {
        this.characterService.toggleMenu("items");
    }

    get_Items() {
        return this.itemsService.get_Items();
    }
    get_Weapons() {
        return this.itemsService.get_Weapons().filter(item => !item.hide);
    }
    get_Armors() {
        return this.itemsService.get_Armors().filter(item => !item.hide);
    }
    get_Shields() {
        return this.itemsService.get_Shields().filter(item => !item.hide);
    }
    get_WornItems() {
        return this.itemsService.get_WornItems();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    grant_Item(item) {
        return this.itemsService.grant_Item(this.characterService, item);
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