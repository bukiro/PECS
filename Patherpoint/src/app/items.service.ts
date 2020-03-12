import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { ItemCollection } from './ItemCollection';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: ItemCollection;
    private loader_Weapons = [];
    private loading_Weapons: Boolean = false;
    private loader_Armors = [];
    private loading_Armors: Boolean = false;
    private loader_Shields = [];
    private loading_Shields: Boolean = false;
    private loader_WornItems = [];
    private loading_WornItems: Boolean = false;
    itemsMenuState: string = 'out';

    constructor(
        private http: HttpClient,
    ) { }

    toggleItemsMenu(position: string = "") {
        if (position) {
            this.itemsMenuState = position;
        } else {
            this.itemsMenuState = (this.itemsMenuState == 'out') ? 'in' : 'out';
        }
    }

    get_itemsMenuState() {
        return this.itemsMenuState;
    }

    get_Items() {
        if (!this.still_loading()) {
            return this.items;
        } else { return new ItemCollection }
    }

    get_Weapons(name: string = "") {
        if (!this.still_loading()) {
            return this.items.weapons.filter(weapon => weapon.name == name || name == "");
        } else { return [] }
    }

    get_Armors(name: string = "") {
        if (!this.still_loading()) {
            return this.items.armors.filter(armor => armor.name == name || name == "");
        } else { return [] }
    }

    get_Shields(name: string = "") {
        if (!this.still_loading()) {
            return this.items.shields.filter(shield => shield.name == name || name == "");
        } else { return [] }
    }

    get_WornItems(name: string = "") {
        if (!this.still_loading()) {
            return this.items.wornitems.filter(wornitem => wornitem.name == name || name == "");
        } else { return [] }
    }

    grant_Item(characterService: CharacterService, item) {
        characterService.grant_InventoryItem(item);
    }

    still_loading() {
        return (this.loading_Weapons || this.loading_Armors || this.loading_Shields || this.loading_WornItems);
    }

    load_Weapons(): Observable<String[]>{
        return this.http.get<String[]>('/assets/weapons.json');
    }

    load_Armors(): Observable<String[]>{
        return this.http.get<String[]>('/assets/armors.json');
    }

    load_Shields(): Observable<String[]>{
        return this.http.get<String[]>('/assets/shields.json');
    }

    load_WornItems(): Observable<String[]>{
        return this.http.get<String[]>('/assets/wornitems.json');
    }

    initialize() {
        if (!this.items) {
            this.items = new ItemCollection();
            this.loading_Weapons = true;
            this.load_Weapons()
                .subscribe((results:String[]) => {
                    this.loader_Weapons = results;
                    this.finish_Weapons()
                });
            this.loading_Armors = true;
            this.load_Armors()
                .subscribe((results:String[]) => {
                    this.loader_Armors = results;
                    this.finish_Armors()
                });
            this.loading_Shields = true;
            this.load_Shields()
                .subscribe((results:String[]) => {
                    this.loader_Shields = results;
                    this.finish_Shields()
                });
            this.load_WornItems()
                .subscribe((results:String[]) => {
                    this.loader_WornItems = results;
                    this.finish_WornItems()
                });
        }
    }

    finish_Weapons() {
        if (this.loader_Weapons) {
            this.items.weapons = this.loader_Weapons.map(element => Object.assign(new Weapon(), element));
            this.loader_Weapons = [];
        }
        if (this.loading_Weapons) {this.loading_Weapons = false;}
    }

    finish_Armors() {
        if (this.loader_Armors) {
            this.items.armors = this.loader_Armors.map(element => Object.assign(new Armor(), element));
            this.loader_Armors = [];
        }
        if (this.loading_Armors) {this.loading_Armors = false;}
    }

    finish_Shields() {
        if (this.loader_Shields) {
            this.items.shields = this.loader_Shields.map(element => Object.assign(new Shield(), element));
            this.loader_Shields = [];
        }
        if (this.loading_Shields) {this.loading_Shields = false;}
    }

    finish_WornItems() {
        if (this.loader_WornItems) {
            this.items.wornitems = this.loader_WornItems.map(element => Object.assign(new Shield(), element));
            this.loader_WornItems = [];
        }
        if (this.loading_WornItems) {this.loading_WornItems = false;}
    }

}