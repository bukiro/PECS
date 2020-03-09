import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';

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
        public traitsService: TraitsService,
        public effectsService: EffectsService
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

    get_Bulk() {
        let bulk = this.characterService.get_Character().bulk;
        bulk.calculate(this.characterService, this.effectsService);
        if (bulk.$current > bulk.$encumbered.value && this.characterService.get_ActiveConditions("Encumbered", "Bulk").length == 0) {
            this.characterService.add_Condition("Encumbered", 0, "Bulk")
        }
        return [bulk];
    }

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    get_ConditionsShowingOn(skillName: string) {
        return this.characterService.get_ConditionsShowingOn(skillName);
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
