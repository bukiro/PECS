/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import * as json_ancestries from 'src/assets/json/animalcompanions';
import * as json_levels from 'src/assets/json/animalcompanionlevels';
import * as json_specializations from 'src/assets/json/animalcompanionspecializations';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { TypeService } from 'src/app/services/type.service';

@Injectable({
    providedIn: 'root',
})
export class AnimalCompanionsService {

    private _companionAncestries: Array<AnimalCompanionAncestry> = [];
    private _companionLevels: Array<AnimalCompanionLevel> = [];
    private _companionSpecializations: Array<AnimalCompanionSpecialization> = [];
    private _ancestriesInitialized = false;
    private _levelsInitialized = false;
    private _specializationsInitialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !(this._ancestriesInitialized && this._levelsInitialized && this._specializationsInitialized);
    }

    public companionTypes(name = ''): Array<AnimalCompanionAncestry> {
        if (!this.stillLoading) {
            return this._companionAncestries.filter(animalCompanion => !name || animalCompanion.name === name);
        } else { return [new AnimalCompanionAncestry()]; }
    }

    public companionLevels(): Array<AnimalCompanionLevel> {
        if (!this.stillLoading) {
            return this._companionLevels;
        } else { return [new AnimalCompanionLevel()]; }
    }

    public companionSpecializations(name = ''): Array<AnimalCompanionSpecialization> {
        if (!this.stillLoading) {
            return this._companionSpecializations.filter(spec => !name || spec.name === name);
        } else { return [new AnimalCompanionSpecialization()]; }
    }

    public restoreAncestryFromSave(ancestry: AnimalCompanionAncestry): AnimalCompanionAncestry {
        let restoredAncestry: AnimalCompanionAncestry;

        if (ancestry.name) {
            const libraryObject = this.companionTypes(ancestry.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredAncestry = TypeService.merge<AnimalCompanionAncestry>(libraryObject, ancestry);
                } catch (e) {
                    console.error(`Failed restoring animal companion ancestry: ${ e }`);
                }
            }
        }

        return restoredAncestry || ancestry;
    }

    public cleanAncestryForSave(ancestry: AnimalCompanionAncestry): void {
        if (ancestry.name) {
            const libraryObject = this.companionTypes(ancestry.name)[0];

            if (libraryObject) {
                Object.keys(ancestry).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item.
                        // If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify(ancestry[key]) === JSON.stringify(libraryObject[key])) {
                            delete ancestry[key];
                        }
                    }
                });
            }
        }
    }

    public restoreLevelsFromSave($class: AnimalCompanionClass): AnimalCompanionClass {
        if ($class.levels) {
            const libraryObject = this.companionLevels();

            if (libraryObject) {
                try {
                    $class.levels = TypeService.merge<Array<AnimalCompanionLevel>>(libraryObject, $class.levels);
                } catch (e) {
                    console.error(`Failed restoring animal companion levels: ${ e }`);
                }
            }
        }

        return $class;
    }

    public cleanLevelsForSave($class: AnimalCompanionClass): void {
        if ($class.levels) {
            const libraryObject = this.companionLevels();

            if (libraryObject) {
                $class.levels.forEach(level => {
                    Object.keys(level).forEach((key, index) => {
                        if (key !== 'name') {
                            // If the Object has a name, and a library item can be found with that name,
                            // compare the property with the library item.
                            // If they have the same value, delete the property from the item
                            // - it can be recovered during loading from the database.
                            if (JSON.stringify(level[key]) === JSON.stringify(libraryObject[index][key])) {
                                delete level[key];
                            }
                        }
                    });
                });
            }
        }
    }

    public restoreSpecializationFromSave(spec: AnimalCompanionSpecialization): AnimalCompanionSpecialization {
        let restoredSpecialization: AnimalCompanionSpecialization;

        if (spec.name) {
            const libraryObject = this.companionSpecializations(spec.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredSpecialization = TypeService.merge(libraryObject, spec);
                } catch (e) {
                    console.error(`Failed restoring animal companion specialization: ${ e }`);
                }
            }
        }

        return restoredSpecialization || spec;
    }

    public cleanSpecializationForSave(spec: AnimalCompanionSpecialization): void {
        if (spec.name) {
            const libraryObject = this.companionSpecializations(spec.name)[0];

            if (libraryObject) {
                Object.keys(spec).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item.
                        // If they have the same value, delete the property from the item - it can be recovered during loading via the name.
                        if (JSON.stringify(spec[key]) === JSON.stringify(libraryObject[key])) {
                            delete spec[key];
                        }
                    }
                });
            }
        }
    }

    public changeType(companion: AnimalCompanion, type: AnimalCompanionAncestry): void {
        companion.class.ancestry =
            Object.assign<AnimalCompanionAncestry, AnimalCompanionAncestry>(
                new AnimalCompanionAncestry(),
                JSON.parse(JSON.stringify(type)),
            ).recast();
    }

    public addSpecialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization, levelNumber: number): void {
        companion.class.specializations.push(
            Object.assign<AnimalCompanionSpecialization, AnimalCompanionSpecialization>(
                new AnimalCompanionSpecialization(),
                {
                    ...JSON.parse(JSON.stringify(spec)),
                    level: levelNumber,
                },
            ).recast(),
        );
    }

    public removeSpecialization(companion: AnimalCompanion, spec: AnimalCompanionSpecialization): void {
        companion.class.specializations = companion.class.specializations.filter(specialization => specialization.name !== spec.name);
    }

    public initialize(): void {
        this._companionAncestries = this._load(json_ancestries, 'companionAncestries', AnimalCompanionAncestry.prototype);
        this._ancestriesInitialized = true;

        this._companionLevels = this._load(json_levels, 'companionLevels', AnimalCompanionLevel.prototype);
        //Sort levels by level number, after it may have got out of order with duplicates.
        this._companionLevels.sort((a, b) => a.number - b.number);
        this._levelsInitialized = true;

        this._companionSpecializations =
            this._load(json_specializations, 'companionSpecializations', AnimalCompanionSpecialization.prototype);
        this._specializationsInitialized = true;
    }

    public reset(): void {
        //Disable any active hint effects when loading a character.
        this._companionAncestries.forEach(ancestry => {
            ancestry.hints?.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            });
        });
        //Disable any active hint effects when loading a character.
        this._companionSpecializations.forEach(spec => {
            spec.hints?.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            });
        });
    }

    private _load<T extends AnimalCompanionAncestry | AnimalCompanionLevel | AnimalCompanionSpecialization>(
        data: { [fileContent: string]: Array<unknown> },
        target: string,
        prototype: T,
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(Object.create(prototype), entry).recast(),
            ));
        });

        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'name', target);

        return resultingData;
    }

}
