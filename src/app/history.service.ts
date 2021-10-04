import { Injectable } from '@angular/core';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import * as json_ancestries from '../assets/json/ancestries';
import * as json_backgrounds from '../assets/json/backgrounds';
import * as json_heritages from '../assets/json/heritages';
import { ExtensionsService } from './extensions.service';
import { TypeService } from './type.service';

@Injectable({
    providedIn: 'root'
})
export class HistoryService {
    private ancestries: Ancestry[] = [];
    private heritages: Heritage[] = [];
    private backgrounds: Background[] = [];
    private loading_ancestries: boolean = false;
    private loading_backgrounds: boolean = false;
    private loading_heritages: boolean = false;

    constructor(
        private typeService: TypeService,
        private extensionsService: ExtensionsService
    ) { }

    get_Ancestries(name: string = "") {
        if (!this.loading_ancestries) {
            return this.ancestries.filter(ancestry => (ancestry.name == name || name == ""));
        } else { return [new Ancestry()] }
    }

    get_Heritages(name: string = "", ancestryName: string = "") {
        if (!this.loading_heritages) {
            return this.heritages.filter(heritage => (heritage.name == name || name == "")
                && (ancestryName == "" || this.get_Ancestries(ancestryName)[0].heritages.includes(heritage.name)));
        } else { return [new Heritage()] }
    }

    get_HeritagesAndSubtypes(name: string = "") {
        if (!this.loading_heritages) {
            let heritages: Heritage[] = [];
            heritages.push(...this.heritages);
            heritages.forEach(heritage => {
                heritages.push(...heritage.subTypes);
            })
            return heritages.filter(heritage => (heritage.name == name || name == ""));
        } else { return [new Heritage()] }
    }

    get_Backgrounds(name: string = "") {
        if (!this.loading_backgrounds) {
            return this.backgrounds.filter(background => (background.name == name || name == ""));
        } else { return [new Background()] }
    }

    restore_AncestryFromSave(ancestry: Ancestry) {
        if (ancestry.name) {
            let libraryObject = this.get_Ancestries(ancestry.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    ancestry = this.typeService.merge(libraryObject, ancestry);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        return ancestry;
    }

    clean_AncestryForSave(ancestry: Ancestry) {
        if (ancestry.name) {
            let libraryObject = this.get_Ancestries(ancestry.name)[0];
            if (libraryObject) {
                Object.keys(ancestry).forEach(key => {
                    if (!["name", "_className"].includes(key)) {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(ancestry[key]) == JSON.stringify(libraryObject[key])) {
                            delete ancestry[key];
                        }
                    }
                })
            }
        }
        return ancestry;
    }

    restore_HeritageFromSave(heritage: Heritage) {
        if (heritage.name) {
            let libraryObject = this.get_HeritagesAndSubtypes(heritage.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    heritage = this.typeService.merge(libraryObject, heritage);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        return heritage;
    }

    clean_HeritageForSave(heritage: Heritage) {
        if (heritage.name) {
            let libraryObject = this.get_HeritagesAndSubtypes(heritage.name)[0];
            if (libraryObject) {
                Object.keys(heritage).forEach(key => {
                    if (!["name", "_className"].includes(key)) {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(heritage[key]) == JSON.stringify(libraryObject[key])) {
                            delete heritage[key];
                        }
                    }
                })
            }
        }
        return heritage;
    }

    restore_BackgroundFromSave(background: Background) {
        if (background.name) {
            let libraryObject = this.get_Backgrounds(background.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    background = this.typeService.merge(libraryObject, background);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        return background;
    }

    clean_BackgroundForSave(background: Background) {
        if (background.name) {
            let libraryObject = this.get_Backgrounds(background.name)[0];
            if (libraryObject) {
                Object.keys(background).forEach(key => {
                    if (!["name", "_className"].includes(key)) {
                        //If the Object has a name, and a library item can be found with that name, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(background[key]) == JSON.stringify(libraryObject[key])) {
                            delete background[key];
                        }
                    }
                })
            }
        }
        return background;
    }

    still_loading() {
        return (this.loading_ancestries || this.loading_backgrounds || this.loading_heritages)
    }

    initialize() {
        //Initialize only once.
        if (!this.ancestries.length) {
            this.loading_ancestries = true;
            this.load(json_ancestries, "ancestries", Ancestry);
            this.loading_ancestries = false;
        }
        if (!this.backgrounds.length) {
            this.loading_backgrounds = true;
            this.load(json_backgrounds, "backgrounds", Background);
            this.loading_backgrounds = false;
        }
        if (!this.heritages.length) {
            this.loading_heritages = true;
            this.load(json_heritages, "heritages", Heritage);
            this.loading_heritages = false;
        }
    }

    load(source, target: string, type) {
        this[target] = [];
        let data = this.extensionsService.extend(source, target);
        Object.keys(data).forEach(key => {
            this[target].push(...data[key].map(obj => Object.assign(new type(), obj).recast()));
        });
        this[target] = this.extensionsService.cleanup_Duplicates(this[target], "name", target);
    }

}