import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Item } from './Item';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: Item[];
    private loader = [];
    private loading: Boolean = false;
    
    constructor(
        private http: HttpClient,
    ) { }
    
    get_Items(key:string = "", value:string = "") {
        if (!this.still_loading()) {
            if (key == "" || value == "") {
                return this.items;
            } else {
                return this.items.filter(
                    item => item[key] == value);
            }
        }
    }

    grant_Item(item) {

    }

    still_loading() {
        return (this.loading);
    }

    load_Items(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items.json');
    }

    initialize() {
        if (!this.items) {
            this.loading = true;
            this.load_Items()
                .subscribe((results:String[]) => {
                    this.loader = results;
                    this.finish_loading()
                });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.items = [];

            this.loader.forEach(element => {
                switch (element.type) {
                    case "weapon":
                        this.items.push(new Weapon(
                            element.type,
                            element.name,
                            element.equip,
                            element.level,
                            element.prof,
                            element.dmgType,
                            element.dicenum,
                            element.dicesize,
                            element.melee,
                            element.ranged,
                            element.itembonus,
                            element.traits
                        ));
                        break;
                    case "armor":
                        this.items.push(new Armor(
                            element.type,
                            element.name,
                            element.equip,
                            element.level,
                            element.prof,
                            element.dexcap,
                            element.skillpenalty,
                            element.speedpenalty,
                            element.strength,
                            element.itembonus,
                            element.traits
                            ));
                        break;
                    case "shield":
                        this.items.push(new Shield(
                            element.type,
                            element.name,
                            element.equip,
                            element.speedpenalty,
                            element.itembonus,
                            element.coverbonus,
                            element.traits
                        ));
                        break;
                }
                });
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }
}