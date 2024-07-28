import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { AnimalCompanionAncestry } from 'src/app/classes/creatures/animal-companion/animal-companion-ancestry';
import { Equipment } from 'src/app/classes/items/equipment';
import { DeepPartial } from '../../definitions/types/deep-partial';
import { AnimalCompanionsDataService } from '../data/animal-companions-data.service';
import { InventoryService } from '../inventory/inventory.service';
import { ItemGrantingService } from '../item-granting/item-granting.service';
import { RecastService } from '../recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionAncestryService {

    constructor(
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _inventoryService: InventoryService,
    ) { }

    public restoreAncestryFromSave(ancestry: DeepPartial<AnimalCompanionAncestry>): AnimalCompanionAncestry {
        let restoredAncestry: AnimalCompanionAncestry | undefined;

        if (ancestry.name) {
            const libraryObject = this._animalCompanionsDataService.companionTypes(ancestry.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                restoredAncestry = libraryObject.clone(RecastService.recastFns).with(ancestry, RecastService.recastFns);
            }
        }

        return restoredAncestry || AnimalCompanionAncestry.from(ancestry, RecastService.recastFns);
    }

    public cleanAncestryForSave(ancestry: AnimalCompanionAncestry): void {
        if (ancestry.name) {
            const libraryObject = this._animalCompanionsDataService.companionTypes(ancestry.name)[0];

            if (libraryObject) {
                (Object.keys(ancestry) as Array<keyof AnimalCompanionAncestry>).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item.
                        // If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify(ancestry[key]) === JSON.stringify(libraryObject[key])) {
                            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                            delete ancestry[key];
                        }
                    }
                });
            }
        }
    }

    public changeAncestry(companion: AnimalCompanion, type?: AnimalCompanionAncestry): void {
        this.processRemovingOldAncestry(companion);

        if (type) {
            companion.class.ancestry = type.clone(RecastService.recastFns);
            this.processNewAncestry(companion);
        } else {
            companion.class.ancestry = new AnimalCompanionAncestry();
        }
    }

    public processRemovingOldAncestry(companion: AnimalCompanion): void {
        if (companion.class.ancestry.name) {
            const _class = companion.class;

            if (_class.ancestry.gainItems.length) {
                _class.ancestry.gainItems.forEach(freeItem => {
                    const items: Array<Equipment> =
                        companion.mainInventory.itemsOfType<Equipment>(freeItem.type)
                            ?.filter((item: Equipment) => item.id === freeItem.grantedItemID) || [];

                    items.forEach(item => {
                        this._inventoryService.dropInventoryItem(
                            companion,
                            companion.mainInventory,
                            item,
                            false,
                            true,
                            true,
                            freeItem.amount,
                        );
                    });
                });
            }
        }
    }

    public processNewAncestry(companion: AnimalCompanion): void {
        if (companion.class.ancestry.name) {
            const _class = companion.class;

            if (_class.ancestry.gainItems.length) {
                _class.ancestry.gainItems.forEach(freeItem => {
                    this._itemGrantingService.grantGrantedItem(freeItem, companion);
                });
            }
        }
    }

}
