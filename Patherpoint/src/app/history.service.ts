import { Injectable, Type } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { SavegameService } from './savegame.service';
import { Loader } from './Loader';

@Injectable({
    providedIn: 'root'
})
export class HistoryService {
    private ancestries: Ancestry[];
    private custom_ancestries: Ancestry[];
    private heritages: Heritage[];
    private custom_heritages: Heritage[];
    private backgrounds: Background[];
    private custom_backgrounds: Background[];
    private loader_Ancestries: Loader = new Loader();
    private loader_Heritages: Loader = new Loader();
    private loader_Backgrounds: Loader = new Loader();
    private loader_CustomAncestries: Loader = new Loader();
    private loader_CustomHeritages: Loader = new Loader();
    private loader_CustomBackgrounds: Loader = new Loader();
    
    constructor(
        private http: HttpClient,
        private savegameService: SavegameService
    ) { }

    get_Ancestries(name: string = "") {
        if (!this.loader_Ancestries.loading) {
            return this.ancestries.concat(this.custom_ancestries).filter(ancestry => (ancestry.name == name || name == ""));
        } else { return [new Ancestry()] }
    }

    get_Heritages(name: string = "", ancestryName: string = "") {
        if (!this.loader_Heritages.loading) {
            return this.heritages.concat(this.custom_heritages).filter(heritage => (heritage.name == name || name == "" )
             && (ancestryName == "" || this.get_Ancestries(ancestryName)[0].heritages.includes(heritage.name)) );
        } else { return [new Heritage()] }
    }

    get_HeritagesAndSubtypes(name: string = "", ancestryName: string = "") {
        if (!this.loader_Heritages.loading) {
            let heritages: Heritage[] = [];
            heritages.push(...this.heritages);
            heritages.push(...this.custom_heritages);
            heritages.forEach(heritage => {
                heritages.push(...heritage.subTypes);
            })
            return heritages.filter(heritage => (heritage.name == name || name == "" ));
        } else { return [new Heritage()] }
    }
    
    get_Backgrounds(name: string = "") {
        if (!this.loader_Backgrounds.loading) {
            return this.backgrounds.concat(this.custom_backgrounds).filter(background => (background.name == name || name == ""));
        } else { return [new Background()] }
    }

    restore_AncestryFromSave(ancestry: Ancestry, savegameService: SavegameService) {
        if (ancestry.name) {
            let libraryObject = this.get_Ancestries(ancestry.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    ancestry = savegameService.merge(libraryObject, ancestry);
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

    restore_HeritageFromSave(heritage: Heritage, savegameService: SavegameService) {
        if (heritage.name) {
            let libraryObject = this.get_HeritagesAndSubtypes(heritage.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    heritage = savegameService.merge(libraryObject, heritage);
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

    restore_BackgroundFromSave(background: Background, savegameService: SavegameService) {
        if (background.name) {
            let libraryObject = this.get_Backgrounds(background.name)[0];
            if (libraryObject) {
                //Map the restored object onto the library object and keep the result.
                try {
                    background = savegameService.merge(libraryObject, background);
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
        return (this.loader_Ancestries.loading || this.loader_Heritages.loading || this.loader_Backgrounds.loading || this.loader_CustomAncestries.loading || this.loader_CustomHeritages.loading || this.loader_CustomBackgrounds.loading)
    }

    initialize() {
        if (!this.ancestries) {
            this.load('/assets/ancestries.json', this.loader_Ancestries, "ancestries", Ancestry);
        }
        if (!this.custom_ancestries) {
            this.load('/assets/custom/ancestries.json', this.loader_CustomAncestries, "custom_ancestries", Ancestry);
        }
        if (!this.backgrounds) {
            this.load('/assets/backgrounds.json', this.loader_Backgrounds, "backgrounds", Background);
        }
        if (!this.custom_backgrounds) {
            this.load('/assets/custom/backgrounds.json', this.loader_CustomBackgrounds, "custom_backgrounds", Background);
        }
        if (!this.heritages) {
            this.load('/assets/heritages.json', this.loader_Heritages, "heritages", Heritage);
        }
        if (!this.custom_heritages) {
            this.load('/assets/custom/heritages.json', this.loader_CustomHeritages, "custom_heritages", Heritage);
        }
    }

    load(filepath: string, loader: Loader, target: string, type) {
        loader.loading = true;
        this.load_File(filepath)
            .subscribe((results:string[]) => {
                loader.content = results;
                this.finish_Loading(loader, target, type)
            });
    }

    load_File(filepath): Observable<string[]>{
        return this.http.get<string[]>(filepath)
        .pipe(map(result => result), catchError(() => of([])));
    }

    finish_Loading(loader: Loader, target: string, type) {
        if (loader.content.length) {
            this[target] = loader.content.map(activity => Object.assign(new type(), activity));

            this[target].forEach(obj => {
                obj = this.savegameService.reassign(obj)
            });

            loader.content = [];
        } else {
            this[target] = [];
        }
        if (loader.loading) {loader.loading = false;}
    }

}