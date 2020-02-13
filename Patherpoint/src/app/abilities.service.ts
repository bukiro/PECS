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
    
    get_Abilities(name: string = "") {
        if (!this.still_loading()) {
            return this.abilities.filter(ability => ability.name == name || name == "");
        } else {
            return [new Ability];
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