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
    private readonly ancestries: Array<Ancestry> = [];
    private readonly heritages: Array<Heritage> = [];
    private readonly backgrounds: Array<Background> = [];
    private loading_ancestries = false;
    private loading_backgrounds = false;
    private loading_heritages = false;

    constructor(
        private readonly typeService: TypeService,
        private readonly extensionsService: ExtensionsService,
    ) { }

    get_Ancestries(name = '') {
        if (!this.loading_ancestries) {
            return this.ancestries.filter(ancestry => (ancestry.name == name || name == ''));
        } else { return [new Ancestry()]; }
    }

    get_Heritages(name = '', ancestryName = '') {
        if (!this.loading_heritages) {
            return this.heritages.filter(heritage => (heritage.name == name || name == '')
                && (ancestryName == '' || this.get_Ancestries(ancestryName)[0].heritages.includes(heritage.name)));
        } else { return [new Heritage()]; }
    }

    get_HeritagesAndSubtypes(name = '') {
        if (!this.loading_heritages) {
            const heritages: Array<Heritage> = [];

            heritages.push(...this.heritages);
            heritages.forEach(heritage => {
                heritages.push(...heritage.subTypes);
            });

            return heritages.filter(heritage => (heritage.name == name || name == ''));
        } else { return [new Heritage()]; }
    }

    get_Backgrounds(name = '') {
        if (!this.loading_backgrounds) {
            return this.backgrounds.filter(background => (background.name == name || name == ''));
        } else { return [new Background()]; }
    }

    restore_AncestryFromSave(ancestry: Ancestry) {
        let restoredAncestry: Ancestry;

        if (ancestry.name) {
            const libraryObject = this.get_Ancestries(ancestry.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredAncestry = this.typeService.merge(libraryObject, ancestry);
                } catch (e) {
                    console.log(`Failed restoring ancestry: ${ e }`);
                }
            }
        }

        return restoredAncestry || ancestry;
    }

    clean_AncestryForSave(ancestry: Ancestry) {
        if (ancestry.name) {
            const libraryObject = this.get_Ancestries(ancestry.name)[0];

            if (libraryObject) {
                Object.keys(ancestry).forEach(key => {
                    if (key != 'name') {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(ancestry[key]) == JSON.stringify(libraryObject[key])) {
                            delete ancestry[key];
                        }
                    }
                });
            }
        }

        return ancestry;
    }

    restore_HeritageFromSave(heritage: Heritage) {
        let restoredHeritage: Heritage;

        if (heritage.name) {
            const libraryObject = this.get_HeritagesAndSubtypes(heritage.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    restoredHeritage = this.typeService.merge(libraryObject, heritage);
                } catch (e) {
                    console.log(`Failed reassigning: ${ e }`);
                }
            }
        }

        return restoredHeritage || heritage;
    }

    clean_HeritageForSave(heritage: Heritage) {
        if (heritage.name) {
            const libraryObject = this.get_HeritagesAndSubtypes(heritage.name)[0];

            if (libraryObject) {
                Object.keys(heritage).forEach(key => {
                    if (key != 'name') {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(heritage[key]) == JSON.stringify(libraryObject[key])) {
                            delete heritage[key];
                        }
                    }
                });
            }
        }

        return heritage;
    }

    restore_BackgroundFromSave(background: Background) {
        let mergedBackground: Background;

        if (background.name) {
            const libraryObject = this.get_Backgrounds(background.name)[0];

            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    mergedBackground = this.typeService.merge(libraryObject, background);
                } catch (e) {
                    console.log(`Failed reassigning: ${ e }`);
                }
            }
        }

        return mergedBackground || background;
    }

    clean_BackgroundForSave(background: Background) {
        if (background.name) {
            const libraryObject = this.get_Backgrounds(background.name)[0];

            if (libraryObject) {
                Object.keys(background).forEach(key => {
                    if (key != 'name') {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(background[key]) == JSON.stringify(libraryObject[key])) {
                            delete background[key];
                        }
                    }
                });
            }
        }

        return background;
    }

    still_loading() {
        return (this.loading_ancestries || this.loading_backgrounds || this.loading_heritages);
    }

    initialize() {
        //Initialize only once.
        if (!this.ancestries.length) {
            this.loading_ancestries = true;
            this.load(json_ancestries, 'ancestries', 'Ancestry');
            this.loading_ancestries = false;
        }

        if (!this.backgrounds.length) {
            this.loading_backgrounds = true;
            this.load(json_backgrounds, 'backgrounds', 'Background');
            this.loading_backgrounds = false;
        }

        if (!this.heritages.length) {
            this.loading_heritages = true;
            this.load(json_heritages, 'heritages', 'Heritage');
            this.loading_heritages = false;
        }
    }

    load(source, target: string, type: string) {
        this[target] = [];

        const data = this.extensionsService.extend(source, target);

        switch (type) {
            case 'Ancestry':
                Object.keys(data).forEach(key => {
                    this[target].push(...data[key].map((obj: Ancestry) => Object.assign(new Ancestry(), obj).recast()));
                });
                break;
            case 'Background':
                Object.keys(data).forEach(key => {
                    this[target].push(...data[key].map((obj: Background) => Object.assign(new Background(), obj).recast()));
                });
                break;
            case 'Heritage':
                Object.keys(data).forEach(key => {
                    this[target].push(...data[key].map((obj: Heritage) => Object.assign(new Heritage(), obj).recast()));
                });
                break;
        }

        this[target] = this.extensionsService.cleanupDuplicates(this[target], 'name', target);
    }

}
