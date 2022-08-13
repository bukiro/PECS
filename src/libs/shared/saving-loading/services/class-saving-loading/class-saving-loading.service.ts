/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Class } from 'src/app/classes/Class';
import { ClassesDataService } from 'src/app/core/services/data/classes-data.service';
import { TypeService } from 'src/app/services/type.service';

@Injectable({
    providedIn: 'root',
})
export class ClassSavingLoadingService {

    constructor(
        private readonly _classesDataService: ClassesDataService,
    ) { }

    public restoreClassFromSave(classObj: Class): Class {
        let restoredClass: Class;

        if (classObj.name) {
            const libraryObject = this._classesDataService.classFromName(classObj.name);

            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                try {
                    restoredClass = TypeService.merge(libraryObject, classObj);
                } catch (e) {
                    console.error(`Failed restoring class: ${ e }`);
                }
            }
        }

        return restoredClass || classObj;
    }

    public cleanClassForSave($class: Class): void {
        if ($class.name) {
            const libraryObject = this._classesDataService.classFromName($class.name);

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

}
