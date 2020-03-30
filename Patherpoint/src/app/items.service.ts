import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { ItemCollection } from './ItemCollection';
import { WornItem } from './WornItem';
import { AlchemicalElixir } from './AlchemicalElixir';
import { Consumable } from './Consumable';
import { ConditionGain } from './ConditionGain';
import { OtherConsumable } from './OtherConsumable';
import { AdventuringGear } from './AdventuringGear';

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
    private loader_HeldItems = [];
    private loading_HeldItems: Boolean = false;
    private loader_AlchemicalElixirs = [];
    private loading_AlchemicalElixirs: Boolean = false;
    private loader_OtherConsumables = [];
    private loading_OtherConsumables: Boolean = false;
    private loader_AdventuringGear = [];
    private loading_AdventuringGear: Boolean = false;
    
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

    get_ItemType(type: string, name: string = "") {
        if (!this.still_loading()) {
            return this.items[type].filter(item => item.name == name || name == "");
        } else { return [] }
    }

    process_Consumable(characterService: CharacterService, item: Consumable) {

        //Apply conditions.
        if (item["gainCondition"]) {
            item["gainCondition"].forEach(gain => {
                let newConditionGain = Object.assign(new ConditionGain(), gain);
                characterService.add_Condition(newConditionGain, false);
            });
        }
    }

    still_loading() {
        return (this.loading_Weapons || this.loading_Armors || this.loading_Shields || this.loading_WornItems || this.loading_AlchemicalElixirs || this.loading_OtherConsumables);
    }

    load_Weapons(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/weapons.json');
    }

    load_Armors(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/armors.json');
    }

    load_Shields(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/shields.json');
    }

    load_WornItems(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/wornitems.json');
    }
    
    load_HeldItems(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/helditems.json');
    }

    load_AlchemicalElixirs(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/alchemicalelixirs.json');
    }

    load_OtherConsumables(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/otherconsumables.json');
    }

    load_AdventuringGear(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/adventuringgear.json');
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
            this.loading_WornItems = true;
            this.load_WornItems()
                .subscribe((results:String[]) => {
                    this.loader_WornItems = results;
                    this.finish_WornItems()
                });
            this.loading_HeldItems = true;
            this.load_HeldItems()
                .subscribe((results:String[]) => {
                    this.loader_HeldItems = results;
                    this.finish_HeldItems()
                });
            this.loading_AlchemicalElixirs = true;
            this.load_AlchemicalElixirs()
                .subscribe((results:String[]) => {
                    this.loader_AlchemicalElixirs = results;
                    this.finish_AlchemicalElixirs()
                });
            this.loading_OtherConsumables = true;
            this.load_OtherConsumables()
                .subscribe((results:String[]) => {
                    this.loader_OtherConsumables = results;
                    this.finish_OtherConsumables()
                });
            this.load_AdventuringGear()
                .subscribe((results:String[]) => {
                    this.loader_AdventuringGear = results;
                    this.finish_AdventuringGear()
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
            this.items.wornitems = this.loader_WornItems.map(element => Object.assign(new WornItem(), element));
            this.loader_WornItems = [];
        }
        if (this.loading_WornItems) {this.loading_WornItems = false;}
    }

    finish_HeldItems() {
        if (this.loader_HeldItems) {
            this.items.helditems = this.loader_HeldItems.map(element => Object.assign(new WornItem(), element));
            this.loader_HeldItems = [];
        }
        if (this.loading_HeldItems) {this.loading_HeldItems = false;}
    }

    finish_AlchemicalElixirs() {
        if (this.loader_AlchemicalElixirs) {
            this.items.alchemicalelixirs = this.loader_AlchemicalElixirs.map(element => Object.assign(new AlchemicalElixir(), element));
            this.loader_AlchemicalElixirs = [];
        }
        if (this.loading_AlchemicalElixirs) {this.loading_AlchemicalElixirs = false;}
    }

    finish_OtherConsumables() {
        if (this.loader_OtherConsumables) {
            this.items.otherconsumables = this.loader_OtherConsumables.map(element => Object.assign(new OtherConsumable(), element));
            this.loader_OtherConsumables = [];
        }
        if (this.loading_OtherConsumables) {this.loading_OtherConsumables = false;}
    }

    finish_AdventuringGear() {
        if (this.loader_AdventuringGear) {
            this.items.adventuringgear = this.loader_AdventuringGear.map(element => Object.assign(new AdventuringGear(), element));
            this.loader_AdventuringGear = [];
        }
        if (this.loading_AdventuringGear) {this.loading_AdventuringGear = false;}
    }

}