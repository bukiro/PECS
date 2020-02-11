import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ability } from './Ability';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AbilitiesService {
    private abilities: Ability[]; 
    private loader; 
    private loading: Boolean = false;
    
    constructor(
        private http: HttpClient,
    ) { }
    
    get_Abilities(key:string = "", value = undefined, key2:string = "", value2 = undefined, key3:string = "", value3 = undefined) {
        if (!this.still_loading()) {
            let abilities = this.abilities;
            if (key == "" || value == undefined) {
                return abilities;
            } else {
                abilities = abilities.filter(
                    item => item[key] == value
                    );
                if (key2 == "" || value2 == undefined) {
                    return abilities;
                } else {
                    abilities = abilities.filter(
                        item => item[key2] == value2
                        );
                    if (key3 == "" || value3 == undefined) {
                        return abilities;
                    } else {
                        abilities = abilities.filter(
                            item => item[key] == value3
                            );
                        return abilities;
                    }
                }
            }
        }
    }

    still_loading() {
        return (this.loading);
    }

    load_Abilities(): Observable<String[]>{
        return this.http.get<String[]>('/assets/abilities.json');
    }

    initialize() {
        if (!this.abilities) {
            this.loading = true;
            this.load_Abilities()
                .subscribe((results:String[]) => {
                    this.loader = results;
                    this.finish_loading()
                });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.abilities = [];

            this.loader.forEach(element => {
                this.abilities.push(element.name = new Ability(element.name))});
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }
}