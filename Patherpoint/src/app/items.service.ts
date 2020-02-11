import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Item } from './Item';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { ElementSchemaRegistry } from '@angular/compiler';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: Item[];
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
                            element.moddable,
                            element.traits,
                            element.potencyRune,
                            element.strikingRune,
                            element.propertyRunes,
                            element.material
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
                            element.moddable,
                            element.traits,
                            element.potencyRune,
                            element.resilientRune,
                            element.propertyRunes,
                            element.material
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
                            element.traits,
                            element.material
                        ));
                        break;
                }
                });
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
        let basicWeapon = this.get_Items("type", "weapon")[0];
        let basicArmor = this.get_Items("type", "armor")[0];
        this.characterService.grant_basicItems(basicWeapon, basicArmor);
    }
}