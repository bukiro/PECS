import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Item } from './Item';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { ElementSchemaRegistry } from '@angular/compiler';
import { ItemCollection } from './ItemCollection';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: ItemCollection;
    private loader = [];
    private loading: Boolean = false;
    itemsMenuState: string = 'out';

    constructor(
        private http: HttpClient,
        public characterService: CharacterService
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
        }
    }

    grant_Item(item) {
        this.characterService.grant_InventoryItem(item);
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
            this.items = new ItemCollection();
            this.items.weapon = [];
            this.items.armor = [];
            this.items.shield = [];

            this.loader.forEach(element => {
                switch (element.type) {
                    case "weapon":
                        this.items.weapon.push(Object.assign(new Weapon(), element));
                        break;
                    case "armor":
                        this.items.armor.push(Object.assign(new Armor(), element));
                        break;
                    case "shield":
                        this.items.shield.push(Object.assign(new Shield(), element));
                        break;
                }
            });
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
        let basicWeapon = this.get_Items().weapon[0];
        let basicArmor = this.get_Items().armor[0];
        this.characterService.grant_basicItems(basicWeapon, basicArmor);
    }
}