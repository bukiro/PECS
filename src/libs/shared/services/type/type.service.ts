/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Item } from 'src/app/classes/Item';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';

type CastFn<T> = (object: Partial<T>) => T;

@Injectable({
    providedIn: 'root',
})
export class TypeService {

    private readonly _itemTypeCastings: Map<string, CastFn<any>> = new Map();

    public castItemByType<T extends Item>(item: Partial<T>, type?: string): T {
        //This function tries to cast an item according to its type name.
        type = type || item.type;

        if (type) {
            return this._itemTypeCastings.get(type)?.(item) || (item as T);
        }

        return item as T;
    }

    public mergeArray<T>(target: Array<T> | undefined, source: Array<Partial<T>>): Array<T> {
        const output: Array<T> = target
            ? JSON.parse(JSON.stringify(target)) as Array<T>
            : [] as Array<T>;

        source.forEach((member, index) => {
            output[index] = this.mergeProperty(target?.[index], member) as T;
        });

        return output;
    }

    public mergeObject<T extends object>(target: T | undefined, source: Partial<T>): T {
        const output = target
            ? Object.assign(Object.create(target), JSON.parse(JSON.stringify(target)))
            : {};

        (Object.keys(source) as Array<keyof T>).forEach(key => {
            output[key] = this.mergeProperty(target?.[key], source[key] as Partial<T[keyof T]>);
        });

        return output;
    }

    public mergeProperty<T>(target: T | Array<T> | undefined, source: Partial<T> | Array<Partial<T>>): T | Array<T> {
        if (Array.isArray(source)) {
            // Merging arrays means merging all of their members.
            return this.mergeArray(target as Array<T>, source);
        } else if (!!source && !!target && typeof target === 'object') {
            // Merging objects means merging all of their properties.
            return this.mergeObject<T & object>(target as T & object, source as Partial<T & object>);
        } else {
            // Merging literals means just accepting the source value over the target value.
            return JSON.parse(JSON.stringify(source));
        }
    }

    public restoreItem<T extends Item>(
        object: T,
        itemsDataService: ItemsDataService,
        options: { type?: string; skipMerge?: boolean } = {},
    ): T {
        if (object.refId && !object.restoredFromSave) {
            const libraryItem = itemsDataService.cleanItemFromID(object.refId) as T;
            let mergedObject = object;

            if (libraryItem) {
                //Map the restored object onto the library object and keep the result.
                try {
                    mergedObject = this.mergeObject<T>(libraryItem, mergedObject) as T;
                    mergedObject = this.castItemByType<T>(mergedObject, options.type || libraryItem.type);

                    //Disable any active hint effects when loading an item.
                    if (mergedObject.isEquipment()) {
                        mergedObject.hints.forEach(hint => hint.deactivateAll());
                    }

                    mergedObject.restoredFromSave = true;
                } catch (e) {
                    console.error(`[TypeService] Failed reassigning item ${ mergedObject.id }: ${ e }`);
                }
            }

            return mergedObject;
        }

        if (options.type) {
            return this.castItemByType<T>(object, options.type);
        }

        return object;
    }

    public registerItemCasting<T extends Item>(prototype: T): void {
        const castFn = (object: Partial<T>): T => Object.assign(Object.create(prototype), object);

        this._itemTypeCastings.set(prototype.type, castFn);
    }

}
