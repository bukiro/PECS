/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { TypeService } from 'src/app/services/type.service';
import { HistoryDataService } from 'src/app/services/history-data.service';

@Injectable({
    providedIn: 'root',
})
export class HistorySavingLoadingService {
    constructor(
        private readonly _historyDataService: HistoryDataService,
    ) { }

    public restoreAncestryFromSave(ancestry: Ancestry): Ancestry {
        let restoredAncestry: Ancestry;

        if (ancestry.name) {
            const libraryObject = this._historyDataService.ancestryFromName(ancestry.name);

            if (libraryObject.name === ancestry.name) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredAncestry = TypeService.merge(libraryObject, ancestry);
                } catch (e) {
                    console.error(`Failed restoring ancestry: ${ e }`);
                }
            }
        }

        return restoredAncestry || ancestry;
    }

    public cleanAncestryForSave(ancestry: Ancestry): Ancestry {
        if (ancestry.name) {
            const libraryObject = this._historyDataService.ancestryFromName(ancestry.name);

            if (libraryObject.name === ancestry.name) {
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
            const libraryObject = this._historyDataService.heritageFromName(heritage.name);

            if (libraryObject.name === heritage.name) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredHeritage = TypeService.merge(libraryObject, heritage);
                } catch (e) {
                    console.error(`Failed restoring heritage: ${ e }`);
                }
            }
        }

        return restoredHeritage || heritage;
    }

    public cleanHeritageForSave(heritage: Heritage): Heritage {
        if (heritage.name) {
            const libraryObject = this._historyDataService.heritageFromName(heritage.name);

            if (libraryObject.name === heritage.name) {
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
            const libraryObject = this._historyDataService.backgroundFromName(background.name);

            if (libraryObject.name === background.name) {
                //Map the restored object onto the library object and keep the result.
                try {
                    mergedBackground = TypeService.merge(libraryObject, background);
                } catch (e) {
                    console.error(`Failed restoring background: ${ e }`);
                }
            }
        }

        return mergedBackground || background;
    }

    public cleanBackgroundForSave(background: Background): Background {
        if (background.name) {
            const libraryObject = this._historyDataService.backgroundFromName(background.name);

            if (libraryObject.name === background.name) {
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

}
