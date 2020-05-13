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
import { ItemActivity } from './ItemActivity';
import { ItemProperty } from './ItemProperty';
import { Item } from './Item';
import { HeldItem } from './HeldItem';
import { ActivityGain } from './ActivityGain';
import { v1 as uuidv1 } from 'uuid';
import { WeaponRune } from './WeaponRune';
import { ArmorRune } from './ArmorRune';
import { Potion } from './Potion';
import { Specialization } from './Specialization';
import { AnimalCompanion } from './AnimalCompanion';
import { Character } from './Character';
import { SavegameService } from './savegame.service';
import { Ammunition } from './Ammunition';
import { SpellChoice } from './SpellChoice';
import { Equipment } from './Equipment';
import { Scroll } from './Scroll';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: ItemCollection;
    private cleanItems: ItemCollection;
    private itemProperties: ItemProperty[];
    private specializations: Specialization[];
    private loader_ItemProperties = [];
    private loading_ItemProperties: Boolean = false;
    private loader_Specializations = [];
    private loading_Specializations: Boolean = false;
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
    private loader_Ammunition = [];
    private loading_Ammunition: Boolean = false;
    private loader_Potions = [];
    private loading_Potions: Boolean = false;
    private loader_OtherConsumables = [];
    private loading_OtherConsumables: Boolean = false;
    private loader_AdventuringGear = [];
    private loading_AdventuringGear: Boolean = false;
    private loader_ArmorRunes = [];
    private loading_ArmorRunes: Boolean = false;
    private loader_WeaponRunes = [];
    private loading_WeaponRunes: Boolean = false;
    private loader_Scrolls = [];
    private loading_Scrolls: Boolean = false;
    /*
    private loader_REPLACE1 = [];
    private loading_REPLACE1: Boolean = false;
    */

    itemsMenuState: string = 'out';

    constructor(
        private http: HttpClient,
        private savegameService: SavegameService
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

    get_cleanItems() {
        if (!this.still_loading()) {
            return this.cleanItems;
        } else { return new ItemCollection }
    }

    get_ItemByID(id: string) {
        if (!this.still_loading()) {
            return this.items.allItems().find(item => item.id == id);
        } else { return null }
    }

    get_CleanItemByID(id: string) {
        if (!this.still_loading()) {
            return this.cleanItems.allItems().find(item => item.id == id);
        } else { return null }
    }

    get_ItemProperties() {
        if (!this.still_loading()) {
            return this.itemProperties;
        } else { return [new ItemProperty] }
    }

    get_Specializations(group: string = "") {
        if (!this.still_loading()) {
            return this.specializations.filter(spec => spec.name == group || group == "");
        } else { return [new Specialization] }
    }

    get_ItemType(type: string, name: string = "") {
        if (!this.still_loading()) {
            return this.items[type].filter(item => item.name == name || name == "");
        } else { return [] }
    }

    cast_ItemByType(item: Item, type: string = item.type) {
        if (type) {
            switch (type) {
                case "weapons":
                    return Object.assign(new Weapon(), item);
                case "armors":
                    return Object.assign(new Armor(), item);
                case "shields":
                    return Object.assign(new Shield(), item);
                case "wornitems":
                    return Object.assign(new WornItem(), item);
                case "helditems":
                    return Object.assign(new HeldItem(), item);
                case "alchemicalelixirs":
                    return Object.assign(new AlchemicalElixir(), item);
                case "potions":
                    return Object.assign(new Potion(), item);
                case "otherconsumables":
                    return Object.assign(new OtherConsumable(), item);
                case "adventuringgear":
                    return Object.assign(new AdventuringGear(), item);
                case "ammunition":
                    return Object.assign(new Ammunition(), item);
                case "armorrunes":
                    return Object.assign(new ArmorRune(), item);
                case "weaponrunes":
                    return Object.assign(new WeaponRune(), item);
                case "scrolls":
                    return Object.assign(new Scroll(), item);
            }
        } else if (item._className) {
            return this.cast_ItemByClassName(item)
        } else {
            return item;
        }
    }

    cast_ItemByClassName(item: Item, className = item._className) {
        if (className) {
            switch (className) {
                case "Weapon":
                    return Object.assign(new Weapon(), item);
                case "Armor":
                    return Object.assign(new Armor(), item);
                case "Shield":
                    return Object.assign(new Shield(), item);
                case "WornItem":
                    return Object.assign(new WornItem(), item);
                case "HeldItem":
                    return Object.assign(new HeldItem(), item);
                case "AlchemicalElixir":
                    return Object.assign(new AlchemicalElixir(), item);
                case "Potion":
                    return Object.assign(new Potion(), item);
                case "OtherConsumable":
                    return Object.assign(new OtherConsumable(), item);
                case "AdventuringGear":
                    return Object.assign(new AdventuringGear(), item);
                case "Ammunition":
                    return Object.assign(new Ammunition(), item);
                case "ArmorRune":
                    return Object.assign(new ArmorRune(), item);
                case "WeaponRune":
                    return Object.assign(new WeaponRune(), item);
                case "Scroll":
                    return Object.assign(new Scroll(), item);
            }
        } else if (item.type) {
            return this.cast_ItemByType(item)
        } else {
            return item;
        }

    }

    initialize_Item(item: any, preassigned: boolean = false, newID: boolean = true) {
        //Every new item has to be re-assigned its class and iterate over all its objects to reassign them as well.
        //Typescript does not seem to have the option to keep object properties' classes when assigning.
        let newItem: any;
        //Set preassigned if you have already given the item a Class. Otherwise it will be determined by the item's type.
        if (preassigned) {
            newItem = Object.assign(new item.constructor(), item);
        } else {
            newItem = this.cast_ItemByType(item);
        }
        if (newID) {
            newItem.id = uuidv1();
        }
        newItem = this.savegameService.reassign(newItem);
        if (newItem.gainActivities) {
            (newItem as Equipment).gainActivities.forEach((gain: ActivityGain) => {
                gain.source = newItem.id;
                gain.active = false;
            });
        }
        if (newItem.activities) {
            (newItem as Equipment).activities.forEach((activity: ItemActivity) => {
                activity.source = newItem.id;
                activity.active = false;
            });
        }
        if (newItem.storedSpells) {
            (newItem as Item).storedSpells.forEach((choice: SpellChoice, index) => {
                choice.source = newItem.id;
                choice.id = "0-Spell-" + newItem.id + index;
            });
        }

        return newItem;
    }

    load_InventoryItem(item: any) {
        if (item.refId) {
            let libraryItem = this.get_CleanItemByID(item.refId);
            if (libraryItem) {
                //Make a safe copy of the library item and give it the same class.
                //Then map the inventory item onto the copy and keep that.
                let copy: Item;
                try {
                    copy = this.cast_ItemByClassName(copy, libraryItem._className);
                    copy = Object.assign(copy, JSON.parse(JSON.stringify(libraryItem)))
                    item = Object.assign(copy, item);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        item = this.initialize_Item(item, true, false);
        return item;
    }

    cleanItemForSave(item: any) {
        if (item.refId) {
            let libraryItem = this.get_CleanItemByID(item.refId);
            if (libraryItem) {
                Object.keys(item).forEach(key => {
                    if (!item.save.includes(key)) {
                        //If the item has a refId, a library item can be found with that id, and the property is not on the save list, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        if (JSON.stringify(item[key]) == JSON.stringify(libraryItem[key])) {
                            delete item[key];
                        }
                    }
                })
            }
        }
        return item;
    }

    process_Consumable(creature: Character | AnimalCompanion, characterService: CharacterService, item: Consumable) {

        //Apply conditions.
        if (item["gainConditions"]) {
            item["gainConditions"].forEach(gain => {
                let newConditionGain = Object.assign(new ConditionGain(), gain);
                characterService.add_Condition(creature, newConditionGain, false);
            });
        }

        //One time effects
        if (item.onceEffects) {
            item.onceEffects.forEach(effect => {
                characterService.process_OnceEffect(creature, effect);
            })
        }
    }

    still_loading() {
        return (this.loading_ItemProperties || this.loading_Weapons || this.loading_Armors || this.loading_Shields || this.loading_WornItems || this.loading_AlchemicalElixirs || this.loading_OtherConsumables);
    }

    initialize(reset: boolean = true) {
        if (!this.items || reset) {
            this.itemProperties = [];
            this.loading_ItemProperties = true;
            this.load_ItemProperties()
                .subscribe((results: String[]) => {
                    this.loader_ItemProperties = results;
                    this.finish_ItemProperties()
                });
            this.specializations = [];
            this.loading_Specializations = true;
            this.load_Specializations()
                .subscribe((results: String[]) => {
                    this.loader_Specializations = results;
                    this.finish_Specializations()
                });
            this.items = new ItemCollection();
            this.cleanItems = new ItemCollection();
            this.loading_Weapons = true;
            this.load_Weapons()
                .subscribe((results: String[]) => {
                    this.loader_Weapons = results;
                    this.finish_Weapons()
                });
            this.loading_Armors = true;
            this.load_Armors()
                .subscribe((results: String[]) => {
                    this.loader_Armors = results;
                    this.finish_Armors()
                });
            this.loading_Shields = true;
            this.load_Shields()
                .subscribe((results: String[]) => {
                    this.loader_Shields = results;
                    this.finish_Shields()
                });
            this.loading_WornItems = true;
            this.load_WornItems()
                .subscribe((results: String[]) => {
                    this.loader_WornItems = results;
                    this.finish_WornItems()
                });
            this.loading_HeldItems = true;
            this.load_HeldItems()
                .subscribe((results: String[]) => {
                    this.loader_HeldItems = results;
                    this.finish_HeldItems()
                });
            this.loading_Ammunition = true;
            this.load_Ammunition()
                .subscribe((results: String[]) => {
                    this.loader_Ammunition = results;
                    this.finish_Ammunition()
                });
            this.loading_AlchemicalElixirs = true;
            this.load_AlchemicalElixirs()
                .subscribe((results: String[]) => {
                    this.loader_AlchemicalElixirs = results;
                    this.finish_AlchemicalElixirs()
                });
            this.loading_Potions = true;
            this.load_Potions()
                .subscribe((results: String[]) => {
                    this.loader_Potions = results;
                    this.finish_Potions()
                });
            this.loading_OtherConsumables = true;
            this.load_OtherConsumables()
                .subscribe((results: String[]) => {
                    this.loader_OtherConsumables = results;
                    this.finish_OtherConsumables()
                });
            this.loading_AdventuringGear = true;
            this.load_AdventuringGear()
                .subscribe((results: String[]) => {
                    this.loader_AdventuringGear = results;
                    this.finish_AdventuringGear()
                });
            this.loading_ArmorRunes = true;
            this.load_ArmorRunes()
                .subscribe((results: String[]) => {
                    this.loader_ArmorRunes = results;
                    this.finish_ArmorRunes()
                });
            this.loading_WeaponRunes = true;
            this.load_WeaponRunes()
                .subscribe((results: String[]) => {
                    this.loader_WeaponRunes = results;
                    this.finish_WeaponRunes()
                });
            this.loading_Scrolls = true;
            this.load_Scrolls()
                .subscribe((results: String[]) => {
                    this.loader_Scrolls = results;
                    this.finish_Scrolls()
                });
            /*
            this.loading_REPLACE1 = true;
            this.load_REPLACE1()
                .subscribe((results: String[]) => {
                    this.loader_REPLACE1 = results;
                    this.finish_REPLACE1()
                });
            */
        }
    }

    load_ItemProperties(): Observable<String[]> {
        return this.http.get<String[]>('/assets/itemProperties.json');
    }

    finish_ItemProperties() {
        if (this.loader_ItemProperties) {
            this.itemProperties = this.loader_ItemProperties.map(element => Object.assign(new ItemProperty(), element));
            this.loader_ItemProperties = [];
        }
        if (this.loading_ItemProperties) { this.loading_ItemProperties = false; }
    }

    load_Specializations(): Observable<String[]> {
        return this.http.get<String[]>('/assets/specializations.json');
    }

    finish_Specializations() {
        if (this.loader_Specializations) {
            this.specializations = this.loader_Specializations.map(element => Object.assign(new Specialization(), element));
            this.loader_Specializations = [];
        }
        if (this.loading_Specializations) { this.loading_Specializations = false; }
    }

    load_Weapons(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/weapons.json');
    }

    finish_Weapons() {
        if (this.loader_Weapons) {
            this.items.weapons = this.loader_Weapons.map(element => this.initialize_Item(Object.assign(new Weapon(), element), true, false));
            this.cleanItems.weapons = this.loader_Weapons.map(element => this.initialize_Item(Object.assign(new Weapon(), element), true, false));
            this.loader_Weapons = [];
        }
        if (this.loading_Weapons) { this.loading_Weapons = false; }
    }

    load_Armors(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/armors.json');
    }

    finish_Armors() {
        if (this.loader_Armors) {
            this.items.armors = this.loader_Armors.map(element => this.initialize_Item(Object.assign(new Armor(), element), true, false));
            this.cleanItems.armors = this.loader_Armors.map(element => this.initialize_Item(Object.assign(new Armor(), element), true, false));
            this.loader_Armors = [];
        }
        if (this.loading_Armors) { this.loading_Armors = false; }
    }

    load_Shields(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/shields.json');
    }

    finish_Shields() {
        if (this.loader_Shields) {
            this.items.shields = this.loader_Shields.map(element => this.initialize_Item(Object.assign(new Shield(), element), true, false));
            this.cleanItems.shields = this.loader_Shields.map(element => this.initialize_Item(Object.assign(new Shield(), element), true, false));
            this.loader_Shields = [];
        }
        if (this.loading_Shields) { this.loading_Shields = false; }
    }

    load_WornItems(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/wornitems.json');
    }

    finish_WornItems() {
        if (this.loader_WornItems) {
            this.items.wornitems = this.loader_WornItems.map(element => this.initialize_Item(Object.assign(new WornItem(), element), true, false));
            this.cleanItems.wornitems = this.loader_WornItems.map(element => this.initialize_Item(Object.assign(new WornItem(), element), true, false));
            this.loader_WornItems = [];
        }
        if (this.loading_WornItems) { this.loading_WornItems = false; }
    }

    load_HeldItems(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/helditems.json');
    }

    finish_HeldItems() {
        if (this.loader_HeldItems) {
            this.items.helditems = this.loader_HeldItems.map(element => this.initialize_Item(Object.assign(new HeldItem(), element), true, false));
            this.cleanItems.helditems = this.loader_HeldItems.map(element => this.initialize_Item(Object.assign(new HeldItem(), element), true, false));
            this.loader_HeldItems = [];
        }
        if (this.loading_HeldItems) { this.loading_HeldItems = false; }
    }

    load_Ammunition(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/ammunition.json');
    }

    finish_Ammunition() {
        if (this.loader_Ammunition) {
            this.items.ammunition = this.loader_Ammunition.map(element => this.initialize_Item(Object.assign(new Ammunition(), element), true, false));
            this.cleanItems.ammunition = this.loader_Ammunition.map(element => this.initialize_Item(Object.assign(new Ammunition(), element), true, false));
            this.loader_Ammunition = [];
        }
        if (this.loading_Ammunition) { this.loading_Ammunition = false; }
    }

    load_AlchemicalElixirs(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/alchemicalelixirs.json');
    }

    finish_AlchemicalElixirs() {
        if (this.loader_AlchemicalElixirs) {
            this.items.alchemicalelixirs = this.loader_AlchemicalElixirs.map(element => this.initialize_Item(Object.assign(new AlchemicalElixir(), element), true, false));
            this.cleanItems.alchemicalelixirs = this.loader_AlchemicalElixirs.map(element => this.initialize_Item(Object.assign(new AlchemicalElixir(), element), true, false));
            this.loader_AlchemicalElixirs = [];
        }
        if (this.loading_AlchemicalElixirs) { this.loading_AlchemicalElixirs = false; }
    }

    load_Potions(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/potions.json');
    }

    finish_Potions() {
        if (this.loader_Potions) {
            this.items.potions = this.loader_Potions.map(element => this.initialize_Item(Object.assign(new Potion(), element), true, false));
            this.cleanItems.potions = this.loader_Potions.map(element => this.initialize_Item(Object.assign(new Potion(), element), true, false));
            this.loader_Potions = [];
        }
        if (this.loading_Potions) { this.loading_Potions = false; }
    }

    load_OtherConsumables(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/otherconsumables.json');
    }

    finish_OtherConsumables() {
        if (this.loader_OtherConsumables) {
            this.items.otherconsumables = this.loader_OtherConsumables.map(element => this.initialize_Item(Object.assign(new OtherConsumable(), element), true, false));
            this.cleanItems.otherconsumables = this.loader_OtherConsumables.map(element => this.initialize_Item(Object.assign(new OtherConsumable(), element), true, false));
            this.loader_OtherConsumables = [];
        }
        if (this.loading_OtherConsumables) { this.loading_OtherConsumables = false; }
    }

    load_AdventuringGear(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/adventuringgear.json');
    }

    finish_AdventuringGear() {
        if (this.loader_AdventuringGear) {
            this.items.adventuringgear = this.loader_AdventuringGear.map(element => this.initialize_Item(Object.assign(new AdventuringGear(), element), true, false));
            this.cleanItems.adventuringgear = this.loader_AdventuringGear.map(element => this.initialize_Item(Object.assign(new AdventuringGear(), element), true, false));
            this.loader_AdventuringGear = [];
        }
        if (this.loading_AdventuringGear) { this.loading_AdventuringGear = false; }
    }

    load_ArmorRunes(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/armorrunes.json');
    }

    finish_ArmorRunes() {
        if (this.loader_ArmorRunes) {
            this.items.armorrunes = this.loader_ArmorRunes.map(element => this.initialize_Item(Object.assign(new ArmorRune(), element), true, false));
            this.cleanItems.armorrunes = this.loader_ArmorRunes.map(element => this.initialize_Item(Object.assign(new ArmorRune(), element), true, false));
            this.loader_ArmorRunes = [];
        }
        if (this.loading_ArmorRunes) { this.loading_ArmorRunes = false; }
    }

    load_WeaponRunes(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/weaponrunes.json');
    }

    finish_WeaponRunes() {
        if (this.loader_WeaponRunes) {
            this.items.weaponrunes = this.loader_WeaponRunes.map(element => this.initialize_Item(Object.assign(new WeaponRune(), element), true, false));
            this.cleanItems.weaponrunes = this.loader_WeaponRunes.map(element => this.initialize_Item(Object.assign(new WeaponRune(), element), true, false));
            this.loader_WeaponRunes = [];
        }
        if (this.loading_WeaponRunes) { this.loading_WeaponRunes = false; }
    }
    
    load_Scrolls(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/scrolls.json');
    }

    finish_Scrolls() {
        if (this.loader_Scrolls) {
            this.items.scrolls = this.loader_Scrolls.map(element => this.initialize_Item(Object.assign(new Scroll(), element), true, false));
            this.cleanItems.scrolls = this.loader_Scrolls.map(element => this.initialize_Item(Object.assign(new Scroll(), element), true, false));
            this.loader_Scrolls = [];
        }
        if (this.loading_Scrolls) { this.loading_Scrolls = false; }
    }

    /*
    load_REPLACE1(): Observable<String[]> {
        return this.http.get<String[]>('/assets/items/REPLACE2.json');
    }

    finish_REPLACE1() {
        if (this.loader_REPLACE1) {
            this.items.REPLACE2 = this.loader_REPLACE1.map(element => this.initialize_Item(Object.assign(new REPLACE0(), element), true, false));
            this.cleanItems.REPLACE2 = this.loader_REPLACE1.map(element => this.initialize_Item(Object.assign(new REPLACE0(), element), true, false));
            this.loader_REPLACE1 = [];
        }
        if (this.loading_REPLACE1) { this.loading_REPLACE1 = false; }
    }
    */
}