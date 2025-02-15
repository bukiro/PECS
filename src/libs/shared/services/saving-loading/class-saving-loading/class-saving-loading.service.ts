/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { CharacterClass } from 'src/app/classes/creatures/character/character-class';
import { CharacterClassLevel } from 'src/app/classes/creatures/character/character-class-level';
import { ClassesDataService } from '../../data/classes-data.service';
import { RecastService } from '../../recast/recast.service';
import { MaybeSerialized } from 'src/libs/shared/definitions/interfaces/serializable';

@Injectable({
    providedIn: 'root',
})
export class ClassSavingLoadingService {

    constructor(
        private readonly _classesDataService: ClassesDataService,
    ) { }

    public restoreClassFromSave(classObject: MaybeSerialized<CharacterClass>): CharacterClass {
        let restoredClass: CharacterClass | undefined;

        if (classObject.name) {
            const libraryObject = this._classesDataService.classFromName(classObject.name);

            if (libraryObject) {
                //Make a safe copy of the library object.
                //Then map the restored object onto the copy and keep that.
                restoredClass = libraryObject.clone(RecastService.recastFns).with(classObject, RecastService.restoreFns);
            }
        }

        return restoredClass || CharacterClass.from(classObject, RecastService.restoreFns);
    }

    public cleanClassForSave(classObject: CharacterClass): void {
        if (classObject.name) {
            const libraryObject = this._classesDataService.classFromName(classObject.name);

            if (libraryObject) {
                (Object.keys(classObject) as Array<keyof CharacterClass>)
                    .forEach(key => {
                        if (key !== 'name') {
                            // If the Object has a name, and a library item can be found with that name,
                            // compare the property with the library item
                            // If they have the same value, delete the property from the item.
                            if (JSON.stringify(classObject[key]) === JSON.stringify(libraryObject[key])) {
                                delete classObject[key];
                            }
                        }
                    });

                const levels = classObject.levels;

                if (levels?.length) {
                    //Perform the same step for each level.
                    levels.forEach((level, index) => {
                        if (level) {
                            (Object.keys(level) as Array<keyof CharacterClassLevel>)
                                .forEach(key => {
                                    if (key !== 'number') {
                                        if (JSON.stringify(level[key]) === JSON.stringify(libraryObject.levels[index]?.[key])) {
                                            delete level[key];
                                        }
                                    }
                                });
                        }
                    });
                }
            }
        }
    }

}
