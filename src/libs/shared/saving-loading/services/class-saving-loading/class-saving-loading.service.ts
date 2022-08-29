/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Class } from 'src/app/classes/Class';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { ClassesDataService } from 'src/app/core/services/data/classes-data.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';

@Injectable({
    providedIn: 'root',
})
export class ClassSavingLoadingService {

    constructor(
        private readonly _classesDataService: ClassesDataService,
    ) { }

    public restoreClassFromSave(classObject: Class): Class {
        let restoredClass: Class | undefined;

        if (classObject.name) {
            const libraryObject = this._classesDataService.classFromName(classObject.name);

            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                try {
                    restoredClass = TypeService.mergeObject(libraryObject, classObject);
                } catch (e) {
                    console.error(`Failed restoring class: ${ e }`);
                }
            }
        }

        return restoredClass || classObject;
    }

    public cleanClassForSave(classObject: Class): Class {
        if (classObject.name) {
            const libraryObject = this._classesDataService.classFromName(classObject.name);

            if (libraryObject) {
                (Object.keys(classObject) as Array<keyof Class>).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item
                        // If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify(classObject[key]) === JSON.stringify(libraryObject[key])) {
                            delete classObject[key];
                        }
                    }
                });

                //Perform the same step for each level.
                classObject.levels.forEach((level, index) => {
                    (Object.keys(level) as Array<keyof ClassLevel>).forEach(key => {
                        if (key !== 'number') {
                            if (JSON.stringify(level[key]) === JSON.stringify(libraryObject.levels[index][key])) {
                                delete level[key];
                            }
                        }
                    });
                });
            }
        }

        return classObject;
    }

}
