/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import * as json_ancestries from 'src/assets/json/ancestries';
import * as json_backgrounds from 'src/assets/json/backgrounds';
import * as json_heritages from 'src/assets/json/heritages';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { TypeService } from 'src/app/services/type.service';

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    private _ancestries: Array<Ancestry> = [];
    private _heritages: Array<Heritage> = [];
    private _backgrounds: Array<Background> = [];
    private _initialized = false;

    constructor(
        private readonly _typeService: TypeService,
        private readonly _extensionsService: ExtensionsService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public ancestries(name = ''): Array<Ancestry> {
        if (this._initialized) {
            return this._ancestries.filter(ancestry => !name || ancestry.name === name);
        } else { return [new Ancestry()]; }
    }

    public heritages(name = '', ancestryName = ''): Array<Heritage> {
        if (this._initialized) {
            return this._heritages.filter(heritage =>
                (!name || heritage.name === name) &&
                (!ancestryName || this.ancestries(ancestryName)[0].heritages.includes(heritage.name)),
            );
        } else { return [new Heritage()]; }
    }

    public heritagesAndSubtypes(name = ''): Array<Heritage> {
        if (this._initialized) {
            const heritages: Array<Heritage> = [];

            heritages.push(...this._heritages);
            heritages.forEach(heritage => {
                heritages.push(...heritage.subTypes);
            });

            return heritages.filter(heritage => !name || heritage.name === name);
        } else { return [new Heritage()]; }
    }

    public backgrounds(name = ''): Array<Background> {
        if (this._initialized) {
            return this._backgrounds.filter(background => !name || background.name === name);
        } else { return [new Background()]; }
    }

    public restoreAncestryFromSave(ancestry: Ancestry): Ancestry {
        let restoredAncestry: Ancestry;

        if (ancestry.name) {
            const libraryObject = this.ancestries(ancestry.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredAncestry = this._typeService.merge(libraryObject, ancestry);
                } catch (e) {
                    console.error(`Failed restoring ancestry: ${ e }`);
                }
            }
        }

        return restoredAncestry || ancestry;
    }

    public cleanAncestryForSave(ancestry: Ancestry): Ancestry {
        if (ancestry.name) {
            const libraryObject = this.ancestries(ancestry.name)[0];

            if (libraryObject) {
                Object.keys(ancestry).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item
                        // If they have the same value, delete the property from the item
                        // - it can be recovered during loading from the refId.
                        if (JSON.stringify(ancestry[key]) === JSON.stringify(libraryObject[key])) {
                            delete ancestry[key];
                        }
                    }
                });
            }
        }

        return ancestry;
    }

    public restoreHeritageFromSave(heritage: Heritage): Heritage {
        let restoredHeritage: Heritage;

        if (heritage.name) {
            const libraryObject = this.heritagesAndSubtypes(heritage.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredHeritage = this._typeService.merge(libraryObject, heritage);
                } catch (e) {
                    console.error(`Failed restoring heritage: ${ e }`);
                }
            }
        }

        return restoredHeritage || heritage;
    }

    public cleanHeritageForSave(heritage: Heritage): Heritage {
        if (heritage.name) {
            const libraryObject = this.heritagesAndSubtypes(heritage.name)[0];

            if (libraryObject) {
                Object.keys(heritage).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item
                        // If they have the same value, delete the property from the item
                        // - it can be recovered during loading from the refId.
                        if (JSON.stringify(heritage[key]) === JSON.stringify(libraryObject[key])) {
                            delete heritage[key];
                        }
                    }
                });
            }
        }

        return heritage;
    }

    public restoreBackgroundFromSave(background: Background): Background {
        let mergedBackground: Background;

        if (background.name) {
            const libraryObject = this.backgrounds(background.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    mergedBackground = this._typeService.merge(libraryObject, background);
                } catch (e) {
                    console.error(`Failed restoring background: ${ e }`);
                }
            }
        }

        return mergedBackground || background;
    }

    public cleanBackgroundForSave(background: Background): Background {
        if (background.name) {
            const libraryObject = this.backgrounds(background.name)[0];

            if (libraryObject) {
                Object.keys(background).forEach(key => {
                    if (key !== 'name') {
                        // If the Object has a name, and a library item can be found with that name,
                        // compare the property with the library item
                        // If they have the same value, delete the property from the item
                        // - it can be recovered during loading from the refId.
                        if (JSON.stringify(background[key]) === JSON.stringify(libraryObject[key])) {
                            delete background[key];
                        }
                    }
                });
            }
        }

        return background;
    }

    public initialize(): void {
        this._ancestries = this._load(json_ancestries, 'ancestries', Ancestry.prototype);
        this._backgrounds = this._load(json_backgrounds, 'backgrounds', Background.prototype);
        this._heritages = this._load(json_heritages, 'heritages', Heritage.prototype);

        this._initialized = true;
    }

    private _load<T extends Ancestry | Background | Heritage>(
        data: { [fileContent: string]: Array<unknown> },
        target: 'ancestries' | 'backgrounds' | 'heritages',
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
