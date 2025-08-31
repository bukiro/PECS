import { inject, Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { AnimalCompanionAncestry } from '../../util/models/animal-companion-ancestry';
import { AnimalCompanionDataService } from 'src/libs/shared/animal-companion/domain/services/animal-companion-data.service';
import { ItemGrantingService } from 'src/libs/shared/items/domain/services/item-granting.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionAncestryService {

    private readonly _animalCompanionsDataService = inject(AnimalCompanionDataService);
    private readonly _itemGrantingService = inject(ItemGrantingService);

    public restoreAncestryFromSave(ancestry: Serialized<AnimalCompanionAncestry>): AnimalCompanionAncestry {
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
            companion.class().ancestry.set(type.clone(RecastService.recastFns));
            this.processNewAncestry(companion);
        } else {
            companion.class().ancestry.set(new AnimalCompanionAncestry());
        }
    }

    public processRemovingOldAncestry(companion: AnimalCompanion): void {
        const ancestry = companion.class().ancestry();

        if (ancestry.name) {
            ancestry.gainItems.forEach(freeItem => {
                this._itemGrantingService.dropGrantedItem(freeItem, companion);
            });
        }
    }

    public processNewAncestry(companion: AnimalCompanion): void {
        const ancestry = companion.class().ancestry();

        if (ancestry.name) {
            ancestry.gainItems.forEach(freeItem => {
                this._itemGrantingService.grantGrantedItem(freeItem, companion);
            });
        }
    }

}
