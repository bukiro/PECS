import { Injectable } from '@angular/core';
import { Class } from 'src/app/classes/Class';
import * as json_classes from 'src/assets/json/classes';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

@Injectable({
    providedIn: 'root'
})
export class ClassesService {

    classes: Class[] = [];
    private loading = false;
    private classesMap = new Map<string, Class>();

    constructor(
        private typeService: TypeService,
        private itemsService: ItemsService,
        private extensionsService: ExtensionsService
    ) { }

    private get_ReplacementClass(name?: string): Class {
        return Object.assign(new Class(), { name: 'Class not found', 'desc': `${ name ? name : 'The requested class' } does not exist in the class list.` });
    }

    get_ClassFromName(name: string): Class {
        //Returns a named class from the map.
        return this.classesMap.get(name.toLowerCase()) || this.get_ReplacementClass(name);
    }

    get_Classes(name = '') {
        if (!this.still_loading()) {
            if (name) {
                return [this.get_ClassFromName(name)];
            } else {
                return this.classes.filter($class => $class.name == name || name == '');
            }
        } else { return [new Class()]; }
    }

    still_loading() {
        return (this.loading);
    }

    restore_ClassFromSave(classObj: Class) {
        let restoredClass: Class;
        if (classObj.name) {
            const libraryObject = this.get_Classes(classObj.name)[0];
            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                try {
                    restoredClass = this.typeService.merge(libraryObject, classObj);
                } catch (e) {
                    console.log(`Failed reassigning: ${ e }`);
                }
            }
        }
        return restoredClass || classObj;
    }

    clean_ClassForSave($class: Class) {
        if ($class.name) {
            const libraryObject = this.get_Classes($class.name)[0];
            if (libraryObject) {
                Object.keys($class).forEach(key => {
                    if (key != 'name') {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify($class[key]) == JSON.stringify(libraryObject[key])) {
                            delete $class[key];
                        }
                    }
                });
                //Perform the same step for each level.
                if ($class.levels) {
                    for (let index = 0; index < $class.levels.length; index++) {
                        Object.keys($class.levels[index]).forEach(key => {
                            if (key != 'number') {
                                if (JSON.stringify($class.levels[index][key]) == JSON.stringify(libraryObject.levels[index][key])) {
                                    delete $class.levels[index][key];
                                }
                            }
                        });
                    }
                }
            }
        }
        return $class;
    }

    initialize() {
        //Initialize only once.
        if (!this.classes.length) {
            this.loading = true;
            this.load_Classes();
            this.classesMap.clear();
            this.classes.forEach($class => {
                this.classesMap.set($class.name.toLowerCase(), $class);
            });
            this.loading = false;
        }
    }

    load_Classes() {
        this.classes = [];
        const data = this.extensionsService.extend(json_classes, 'classes');
        Object.keys(data).forEach(key => {
            this.classes.push(...data[key].map((obj: Class) => Object.assign(new Class(), obj).recast(this.typeService, this.itemsService)));
        });
        this.classes = this.extensionsService.cleanup_Duplicates(this.classes, 'name', 'classes') as Class[];
    }

}
