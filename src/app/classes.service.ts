import { Injectable } from '@angular/core';
import { Class } from './Class';
import * as json_classes from '../assets/json/classes';
import { ExtensionsService } from './extensions.service';
import { TypeService } from './type.service';
import { ItemsService } from './items.service';

@Injectable({
    providedIn: 'root'
})
export class ClassesService {

    classes: Class[] = [];
    private loading: boolean = false;

    constructor(
        private typeService: TypeService,
        private itemsService: ItemsService,
        private extensionsService: ExtensionsService
    ) { }

    get_Classes(name: string = "") {
        if (!this.still_loading()) {
            return this.classes.filter($class => $class.name == name || name == "")
        } else { return [new Class()] }
    }

    still_loading() {
        return (this.loading);
    }

    restore_ClassFromSave($class: Class) {
        if ($class.name) {
            let libraryObject = this.get_Classes($class.name)[0];
            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                try {
                    $class = this.typeService.merge(libraryObject, $class)
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        return $class;
    }

    clean_ClassForSave($class: Class) {
        if ($class.name) {
            let libraryObject = this.get_Classes($class.name)[0];
            if (libraryObject) {
                Object.keys($class).forEach(key => {
                    if (!["name", "_className"].includes(key)) {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify($class[key]) == JSON.stringify(libraryObject[key])) {
                            delete $class[key];
                        }
                    }
                })
                //Perform the same step for each level.
                if ($class.levels) {
                    for (let index = 0; index < $class.levels.length; index++) {
                        Object.keys($class.levels[index]).forEach(key => {
                            if (!["number", "_className"].includes(key)) {
                                if (JSON.stringify($class.levels[index][key]) == JSON.stringify(libraryObject.levels[index][key])) {
                                    delete $class.levels[index][key];
                                }
                            }
                        })
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
            this.loading = false;
        }
    }

    load_Classes() {
        this.classes = [];
        let data = this.extensionsService.extend(json_classes, "classes");
        Object.keys(data).forEach(key => {
            this.classes.push(...data[key].map(obj => Object.assign(new Class(), obj).recast(this.typeService, this.itemsService)));
        });
        this.classes = this.extensionsService.cleanup_Duplicates(this.classes, "name", "classes");
    }

}
