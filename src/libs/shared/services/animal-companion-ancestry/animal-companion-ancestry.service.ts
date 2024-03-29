import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { Equipment } from 'src/app/classes/Equipment';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';
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
        private readonly _typeService: TypeService,
        private readonly _recastService: RecastService,
    ) { }

    public restoreAncestryFromSave(ancestry: AnimalCompanionAncestry): AnimalCompanionAncestry {
        let restoredAncestry: AnimalCompanionAncestry | undefined;

        if (ancestry.name) {
            const libraryObject = this._animalCompanionsDataService.companionTypes(ancestry.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredAncestry = this._typeService.mergeObject(libraryObject, ancestry);
                } catch (e) {
                    console.error(`Failed restoring animal companion ancestry: ${ e }`);
                }
            }
        }

        return restoredAncestry || ancestry;
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
            companion.class.ancestry = type.clone(this._recastService.recastOnlyFns);
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
                        companion.inventories[0].itemsOfType<Equipment>(freeItem.type)
                            ?.filter((item: Equipment) => item.id === freeItem.grantedItemID) || [];

                    items.forEach(item => {
                        this._inventoryService.dropInventoryItem(
                            companion,
                            companion.inventories[0],
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
