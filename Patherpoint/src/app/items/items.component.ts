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
    public showArmor: Boolean = false;
    public showShields: Boolean = false;

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
        this.itemsService.initialize()
        this.finish_Loading();
    }
}