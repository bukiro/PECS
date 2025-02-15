import { Injectable } from '@angular/core';
import { Item } from 'src/app/classes/items/item';
import { Constructable } from '../../definitions/interfaces/constructable';
import { ItemsDataService } from '../data/items-data.service';
import { ItemTypes } from '../../definitions/types/item-types';
import { MaybeSerialized } from '../../definitions/interfaces/serializable';

type ItemPrototypeFn<T extends Item> = () => T;

@Injectable({
    providedIn: 'root',
})
export class TypeService {

    private readonly _itemPrototypeFunctions: Map<ItemTypes, ItemPrototypeFn<Item>> = new Map();

    public getPrototypeItem<T extends Item>(item: MaybeSerialized<T>, options?: { type?: ItemTypes; prototype?: T }): T {
        if (options?.prototype) {
            return options.prototype;
        }

        //This function tries to cast an item according to its type name.
        const type = options?.type ?? (item.type as ItemTypes | undefined);

        if (!type) {
            throw new Error('[TypeService] Could not create prototype without item type');
        }

        const prototype = this._itemPrototypeFunctions.get(type)?.() as T;

        if (!prototype) {
            throw new Error(`[TypeService] Could not create prototype from type ${ type }`);
        }

        return prototype;
    }

    public getReferenceItem<T extends Item>(
        obj: MaybeSerialized<T>,
        itemsDataService: ItemsDataService,
        options: { type?: ItemTypes; prototype?: T } = {},
    ): T {
        if (obj.refId && !obj.restoredFromSave) {
            const libraryItem = itemsDataService.cleanItemFromID(obj.refId as string) as T;

            if (libraryItem) {
                Reflect.set(obj, 'restoredFromSave', true, obj);

                return libraryItem;
            }
        }

        if (options.type ?? obj.type ?? options.prototype) {
            return this.getPrototypeItem<T>(obj, options);
        }

        throw new Error(`[TypeService] Could not get reference item or prototype for ${ obj.name ?? obj.id }`);
    }

    public registerItemCasting<T extends Item>(constructor: Constructable<T>): void {
        const prototypeFn = (): T => new constructor();

        this._itemPrototypeFunctions.set(new constructor().type, prototypeFn);
    }

}
