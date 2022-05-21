/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Class } from 'src/app/classes/Class';
import * as json_classes from 'src/assets/json/classes';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

@Injectable({
    providedIn: 'root',
})
export class ClassesService {

    private _classes: Array<Class> = [];
    private _initialized = false;
    private readonly _classesMap = new Map<string, Class>();

    constructor(
        private readonly _typeService: TypeService,
        private readonly _itemsService: ItemsService,
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public classFromName(name: string): Class {
        //Returns a named class from the map.
        return this._classesMap.get(name.toLowerCase()) || this._replacementClass(name);
    }

    public classes(name = ''): Array<Class> {
        if (!this.stillLoading()) {
            if (name) {
                return [this.classFromName(name)];
            } else {
                return this._classes.filter($class => !name || $class.name === name);
            }
        } else { return [new Class()]; }
    }

    public stillLoading(): boolean {
        return !this._initialized;
    }

    public restoreClassFromSave(classObj: Class): Class {
        let restoredClass: Class;

        if (classObj.name) {
            const libraryObject = this.classes(classObj.name)[0];

            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                try {
                    restoredClass = this._typeService.merge(libraryObject, classObj);
                } catch (e) {
                    console.error(`Failed restoring class: ${ e }`);
                }
            }
        }

        return restoredClass || classObj;
    }

    public cleanClassForSave($class: Class): void {
        if ($class.name) {
            const libraryObject = this.classes($class.name)[0];

            if (libraryObject) {
                Object.keys($class).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item
                        // If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify($class[key]) === JSON.stringify(libraryObject[key])) {
                            delete $class[key];
                        }
                    }
                });

                //Perform the same step for each level.
                $class.levels.forEach((level, index) => {
                    Object.keys(level).forEach(key => {
                        if (key !== 'number') {
                            if (JSON.stringify(level[key]) === JSON.stringify(libraryObject.levels[index][key])) {
                                delete level[key];
                            }
                        }
                    });
                });
            }
        }
    }

    public initialize(): void {
        this._loadClasses();
        this._classesMap.clear();
        this._classes.forEach($class => {
            this._classesMap.set($class.name.toLowerCase(), $class);
        });
        this._initialized = true;
    }

    private _replacementClass(name?: string): Class {
        return Object.assign(
            new Class(),
            { name: 'Class not found', desc: `${ name ? name : 'The requested class' } does not exist in the class list.` },
        );
    }

    private _loadClasses(): void {
        this._classes = [];

        const data = this._extensionsService.extend(json_classes, 'classes');

        Object.keys(data).forEach(key => {
            this._classes.push(
                ...data[key].map((obj: Class) =>
                    Object.assign(new Class(), obj).recast(this._typeService, this._itemsService),
                ),
            );
        });
        this._classes = this._extensionsService.cleanupDuplicates(this._classes, 'name', 'classes') as Array<Class>;
    }

}
