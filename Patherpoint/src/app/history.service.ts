import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';

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

    get_Backgrounds(name: string = "") {
        if (!this.loading_Backgrounds) {
            return this.backgrounds.filter(background => (background.name == name || name == ""));
        } else { return [new Background()] }
    }

    still_loading() {
        return (this.loading_Ancestries || this.loading_Heritages || this.loading_Backgrounds)
    }

    load_Ancestries(): Observable<String[]>{
        return this.http.get<String[]>('/assets/ancestries.json');
    }

    load_Heritages(): Observable<String[]>{
        return this.http.get<String[]>('/assets/heritages.json');
    }

    load_Backgrounds(): Observable<String[]>{
        return this.http.get<String[]>('/assets/backgrounds.json');
    }

    initialize() {
        if (!this.ancestries) {
            this.loading_Ancestries = true;
            this.load_Ancestries()
                .subscribe((results:String[]) => {
                    this.loader_Ancestries = results;
                    this.finish_loading_Ancestries()
                });
        }
        if (!this.heritages) {
            this.loading_Heritages = true;
            this.load_Heritages()
                .subscribe((results:String[]) => {
                    this.loader_Heritages = results;
                    this.finish_loading_Heritages()
                });
        }
        if (!this.backgrounds) {
            this.loading_Backgrounds = true;
            this.load_Backgrounds()
                .subscribe((results:String[]) => {
                    this.loader_Backgrounds = results;
                    this.finish_loading_Backgrounds()
                });
        } 
    }

    finish_loading_Ancestries() {
        if (this.loader_Ancestries) {
            this.ancestries = this.loader_Ancestries.map(ancestry => Object.assign(new Ancestry(), ancestry));

            this.ancestries.forEach(ancestry => {
                ancestry.reassign();
            })

            this.loader_Ancestries = [];
        }
        if (this.loading_Ancestries) {this.loading_Ancestries = false;}
    }

    finish_loading_Heritages() {
        if (this.loader_Heritages) {
            this.heritages = this.loader_Heritages.map(heritage => Object.assign(new Heritage(), heritage));

            this.heritages.forEach(heritage => {
                heritage.reassign();
            })

            this.loader_Heritages = [];
        }
        if (this.loading_Heritages) {this.loading_Heritages = false;}
    }

    finish_loading_Backgrounds() {
        if (this.loader_Backgrounds) {
            this.backgrounds = this.loader_Backgrounds.map(background => Object.assign(new Background(), background));

            this.backgrounds.forEach(background => {
                background.reassign();
            })

            this.loader_Backgrounds = [];
        }
        if (this.loading_Backgrounds) {this.loading_Backgrounds = false;}
    }

}