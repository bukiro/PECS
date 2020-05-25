import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { SavegameService } from './savegame.service';

@Injectable({
    providedIn: 'root'
})
export class HistoryService {
    private ancestries: Ancestry[];
    private heritages: Heritage[];
    private backgrounds: Background[];
    private loader_Ancestries; 
    private loader_Heritages; 
    private loader_Backgrounds; 
    private loading_Ancestries: boolean = false;
    private loading_Heritages: boolean = false;
    private loading_Backgrounds: boolean = false;
    
    constructor(
        private http: HttpClient,
        private savegameService: SavegameService
    ) { }

    get_Ancestries(name: string = "") {
        if (!this.loading_Ancestries) {
            return this.ancestries.filter(ancestry => (ancestry.name == name || name == ""));
        } else { return [new Ancestry()] }
    }

    get_Heritages(name: string = "", ancestryName: string = "") {
        if (!this.loading_Heritages) {
            return this.heritages.filter(heritage => (heritage.name == name || name == "" )
             && (ancestryName == "" || this.get_Ancestries(ancestryName)[0].heritages.includes(heritage.name)) );
        } else { return [new Heritage()] }
    }

    get_HeritagesAndSubtypes(name: string = "", ancestryName: string = "") {
        if (!this.loading_Heritages) {
            let heritages: Heritage[] = [];
            heritages.push(...this.heritages);
            heritages.forEach(heritage => {
                heritages.push(...heritage.subTypes);
            })
            return heritages.filter(heritage => (heritage.name == name || name == "" ));
        } else { return [new Heritage()] }
    }
    
    get_Backgrounds(name: string = "") {
        if (!this.loading_Backgrounds) {
            return this.backgrounds.filter(background => (background.name == name || name == ""));
        } else { return [new Background()] }
    }

    get_BackgroundsAndSubtypes(name: string = "") {
        if (!this.loading_Backgrounds) {
            let backgrounds: Background[] = [];
            backgrounds.push(...this.backgrounds);
            backgrounds.forEach(background => {
                backgrounds.push(...background.subTypes);
            })
            return backgrounds.filter(background => (background.name == name || name == ""));
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
            let libraryObject = this.get_BackgroundsAndSubtypes(background.name)[0];
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
            let libraryObject = this.get_BackgroundsAndSubtypes(background.name)[0];
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
        return (this.loading_Ancestries || this.loading_Heritages || this.loading_Backgrounds)
    }

    load_Ancestries(): Observable<string[]>{
        return this.http.get<string[]>('/assets/ancestries.json');
    }

    load_Heritages(): Observable<string[]>{
        return this.http.get<string[]>('/assets/heritages.json');
    }

    load_Backgrounds(): Observable<string[]>{
        return this.http.get<string[]>('/assets/backgrounds.json');
    }

    initialize() {
        if (!this.ancestries) {
            this.loading_Ancestries = true;
            this.load_Ancestries()
                .subscribe((results:string[]) => {
                    this.loader_Ancestries = results;
                    this.finish_loading_Ancestries()
                });
        }
        if (!this.heritages) {
            this.loading_Heritages = true;
            this.load_Heritages()
                .subscribe((results:string[]) => {
                    this.loader_Heritages = results;
                    this.finish_loading_Heritages()
                });
        }
        if (!this.backgrounds) {
            this.loading_Backgrounds = true;
            this.load_Backgrounds()
                .subscribe((results:string[]) => {
                    this.loader_Backgrounds = results;
                    this.finish_loading_Backgrounds()
                });
        } 
    }

    finish_loading_Ancestries() {
        if (this.loader_Ancestries) {
            this.ancestries = this.loader_Ancestries.map(ancestry => Object.assign(new Ancestry(), ancestry));

            this.ancestries.forEach(ancestry => {
                ancestry = this.savegameService.reassign(ancestry)
                //ancestry.reassign();
            })

            this.loader_Ancestries = [];
        }
        if (this.loading_Ancestries) {this.loading_Ancestries = false;}
    }

    finish_loading_Heritages() {
        if (this.loader_Heritages) {
            this.heritages = this.loader_Heritages.map(heritage => Object.assign(new Heritage(), heritage));

            this.heritages.forEach(heritage => {
                heritage = this.savegameService.reassign(heritage)
                //heritage.reassign();
            })

            this.loader_Heritages = [];
        }
        if (this.loading_Heritages) {this.loading_Heritages = false;}
    }

    finish_loading_Backgrounds() {
        if (this.loader_Backgrounds) {
            this.backgrounds = this.loader_Backgrounds.map(background => Object.assign(new Background(), background));

            this.backgrounds.forEach(background => {
                background = this.savegameService.reassign(background)
                //background.reassign();
            })

            this.loader_Backgrounds = [];
        }
        if (this.loading_Backgrounds) {this.loading_Backgrounds = false;}
    }

}