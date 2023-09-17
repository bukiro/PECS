/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { HistoryDataService } from 'src/libs/shared/services/data/history-data.service';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

@Injectable({
    providedIn: 'root',
})
export class HistorySavingLoadingService {
    constructor(
        private readonly _historyDataService: HistoryDataService,
    ) { }

    public restoreAncestryFromSave(ancestry: DeepPartial<Ancestry>): Ancestry {
        let restoredAncestry: Ancestry | undefined;

        if (ancestry.name) {
            const libraryObject = this._historyDataService.ancestryFromName(ancestry.name);

            if (libraryObject.name === ancestry.name) {
                //Map the restored object onto the library object and keep the result.
                restoredAncestry = libraryObject.clone().with(ancestry);
            }
        }

        return restoredAncestry || Ancestry.from(ancestry);
    }

    public cleanAncestryForSave(ancestry: Ancestry): void {
        if (ancestry.name) {
            const libraryObject = this._historyDataService.ancestryFromName(ancestry.name);

            if (libraryObject.name === ancestry.name) {
                (Object.keys(ancestry) as Array<keyof Ancestry>).forEach(key => {
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
    }

    public restoreHeritageFromSave(heritage: DeepPartial<Heritage>): Heritage {
        let restoredHeritage: Heritage | undefined;

        if (heritage.name) {
            const libraryObject = this._historyDataService.heritageFromName(heritage.name);

            if (libraryObject.name === heritage.name) {
                //Map the restored object onto the library object and keep the result.
                restoredHeritage = libraryObject.clone().with(heritage);
            }
        }

        return restoredHeritage || Heritage.from(heritage);
    }

    public cleanHeritageForSave(heritage: Heritage): void {
        if (heritage.name) {
            const libraryObject = this._historyDataService.heritageFromName(heritage.name);

            if (libraryObject.name === heritage.name) {
                (Object.keys(heritage) as Array<keyof Heritage>).forEach(key => {
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
    }

    public restoreBackgroundFromSave(background: DeepPartial<Background>): Background {
        let mergedBackground: Background | undefined;

        if (background.name) {
            const libraryObject = this._historyDataService.backgroundFromName(background.name);

            if (libraryObject.name === background.name) {
                //Map the restored object onto the library object and keep the result.
                mergedBackground = libraryObject.clone().with(background);
            }
        }

        return mergedBackground || Background.from(background);
    }

    public cleanBackgroundForSave(background: Background): void {
        if (background.name) {
            const libraryObject = this._historyDataService.backgroundFromName(background.name);

            if (libraryObject.name === background.name) {
                (Object.keys(background) as Array<keyof Background>).forEach(key => {
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
    }

}
