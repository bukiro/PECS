/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { CharacterClass } from 'src/app/classes/CharacterClass';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { ClassesDataService } from 'src/libs/shared/services/data/classes-data.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';

@Injectable({
    providedIn: 'root',
})
export class ClassSavingLoadingService {

    constructor(
        private readonly _classesDataService: ClassesDataService,
        private readonly _typeService: TypeService,
    ) { }

    public restoreClassFromSave(classObject: CharacterClass): CharacterClass {
        let restoredClass: CharacterClass | undefined;

        if (classObject.name) {
            const libraryObject = this._classesDataService.classFromName(classObject.name);

            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                try {
                    restoredClass = this._typeService.mergeObject(libraryObject, classObject);
                } catch (e) {
                    console.error(`Failed restoring class: ${ e }`);
                }
            }
        }

        return restoredClass || classObject;
    }

    public cleanClassForSave(classObject: CharacterClass): CharacterClass {
        if (classObject.name) {
            const libraryObject = this._classesDataService.classFromName(classObject.name);

            if (libraryObject) {
                (Object.keys(classObject) as Array<keyof CharacterClass>).forEach(key => {
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
                classObject.levels?.forEach((level, index) => {
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
