import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public itemsService: ItemsService,
        public traitsService: TraitsService
    ) { }

    still_loading() {
        return this.characterService.still_loading();
    }

    toggleItemsMenu() {
        this.itemsService.toggleItemsMenu();
    }

    get_InventoryItems() {
        return this.characterService.get_InventoryItems();
    }
    
    drop_InventoryItem(item) {
        this.characterService.drop_InventoryItem(item);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    onChange(item) {
        this.characterService.onEquipChange(item);
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
