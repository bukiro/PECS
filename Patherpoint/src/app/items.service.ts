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
import { SpellCast } from './SpellCast';
import { EffectGain } from './EffectGain';
import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';
import { v1 as uuidv1 } from 'uuid';
import { WeaponRune } from './WeaponRune';
import { Rune } from './Rune';
import { LoreChoice } from './LoreChoice';
import { ArmorRune } from './ArmorRune';
import { Potion } from './Potion';
import { Specialization } from './Specialization';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: ItemCollection;
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

    initialize_Item(item: Item, preassigned: boolean = false, newID: boolean = true) {
        //Every new item has to be re-assigned its class, receive an id and iterate over all its objects to reassign them as well.
        //Typescript does not seem to have the option to keep object properties' classes when assigning.
        let newItem: any;
        //Set preassigned if you have already given the item a Class. Otherwise it will be determined by the item's type.
        if (preassigned) {
            newItem = item;
        } else {
            switch (item.type) {
                case "weapons":
                    newItem = Object.assign(new Weapon(), item);
                    break;
                case "armors":
                    newItem = Object.assign(new Armor(), item);
                    break;
                case "shields":
                    newItem = Object.assign(new Shield(), item);
                    break;
                case "wornitems":
                    newItem = Object.assign(new WornItem(), item);
                    break;
                case "helditems":
                    newItem = Object.assign(new HeldItem(), item);
                    break;
                case "alchemicalelixirs":
                    newItem = Object.assign(new AlchemicalElixir(), item);
                    break;
                case "potions":
                    newItem = Object.assign(new Potion(), item);
                    break;
                case "otherconsumables":
                    newItem = Object.assign(new OtherConsumable(), item);
                    break;
                case "adventuringgear":
                    newItem = Object.assign(new AdventuringGear(), item);
                    break;
                case "armorrunes":
                    newItem = Object.assign(new ArmorRune(), item);
                    break;
                case "weaponrunes":
                    newItem = Object.assign(new WeaponRune(), item);
                    break;
            }
        }
        if (newID) {
            newItem.id = uuidv1();
        }
        if (newItem.effects) {
            newItem.effects = newItem.effects.map((effect: EffectGain) => Object.assign(new EffectGain(), effect))
        }
        if (newItem.onceEffects) {
            newItem.onceEffects = newItem.onceEffects.map((effect: EffectGain) => Object.assign(new EffectGain(), effect))
        }
        if (newItem.gainItems) {
            newItem.gainItems = newItem.gainItems.map((gain: ItemGain) => Object.assign(new ItemGain(), gain))
        }
        if (newItem.gainConditions) {
            newItem.gainConditions = newItem.gainConditions.map((gain: ConditionGain) => Object.assign(new ConditionGain(), gain))
        }
        if (newItem.gainActivities) {
            newItem.gainActivities = newItem.gainActivities.map((gain: ActivityGain) => Object.assign(new ActivityGain(), gain))
            newItem.gainActivities.forEach((gain: ActivityGain) => {
                gain.source = newItem.id;
            });
        }
        if (newItem.activities) {
            newItem.activities = newItem.activities.map((activity: ItemActivity) => Object.assign(new ItemActivity(), activity))
            newItem.activities.forEach((activity: ItemActivity) => {
                activity.source = newItem.id;
                activity.castSpells = activity.castSpells.map((castSpell: SpellCast) => Object.assign(new SpellCast(), castSpell));
                activity.effects = activity.effects.map((effect: EffectGain) => Object.assign(new EffectGain(), effect));
                activity.onceEffects = activity.onceEffects.map((effect: EffectGain) => Object.assign(new EffectGain(), effect));
                activity.gainConditions = activity.gainConditions.map((gainConditions: ConditionGain) => Object.assign(new ConditionGain(), gainConditions));
            });
        }
        if (newItem.propertyRunes) {
            newItem.propertyRunes = newItem.propertyRunes.map((rune: Rune) => {
                if (rune.type == "weaponrunes") {return Object.assign(new WeaponRune(), rune);}
                if (rune.type == "armorrunes") {return Object.assign(new ArmorRune(), rune);}
            });
            newItem.propertyRunes.forEach((rune: Rune) => {
                rune.loreChoices = rune.loreChoices.map(choice => Object.assign(new LoreChoice(), choice));
            })
        }
        if (newItem.isHandwrapsOfMightyBlows) {
            newItem.moddable = "weapon";
        }
        return newItem;
    }

    process_Consumable(characterService: CharacterService, item: Consumable) {

        //Apply conditions.
        if (item["gainConditions"]) {
            item["gainConditions"].forEach(gain => {
                let newConditionGain = Object.assign(new ConditionGain(), gain);
                characterService.add_Condition(newConditionGain, false);
            });
        }

        //One time effects
        if (item.onceEffects) {
            item.onceEffects.forEach(effect => {
                characterService.process_OnceEffect(effect);
            })
        }
    }

    still_loading() {
        return (this.loading_ItemProperties || this.loading_Weapons || this.loading_Armors || this.loading_Shields || this.loading_WornItems || this.loading_AlchemicalElixirs || this.loading_OtherConsumables);
    }

    load_ItemProperties(): Observable<String[]>{
        return this.http.get<String[]>('/assets/itemProperties.json');
    }

    load_Specializations(): Observable<String[]>{
        return this.http.get<String[]>('/assets/specializations.json');
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

    load_Potions(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/potions.json');
    }

    load_OtherConsumables(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/otherconsumables.json');
    }

    load_AdventuringGear(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/adventuringgear.json');
    }
    
    load_ArmorRunes(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/armorrunes.json');
    }

    load_WeaponRunes(): Observable<String[]>{
        return this.http.get<String[]>('/assets/items/weaponrunes.json');
    }

    initialize() {
        if (!this.items) {
            this.items = new ItemCollection();
            this.loading_ItemProperties = true;
            this.load_ItemProperties()
                .subscribe((results:String[]) => {
                    this.loader_ItemProperties = results;
                    this.finish_ItemProperties()
                });
            this.items = new ItemCollection();
            this.loading_Specializations = true;
            this.load_Specializations()
                .subscribe((results:String[]) => {
                    this.loader_Specializations = results;
                    this.finish_Specializations()
                });
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
            this.loading_Potions = true;
            this.load_Potions()
                .subscribe((results:String[]) => {
                    this.loader_Potions = results;
                    this.finish_Potions()
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
            this.load_ArmorRunes()
                .subscribe((results:String[]) => {
                    this.loader_ArmorRunes = results;
                    this.finish_ArmorRunes()
                });
            this.load_WeaponRunes()
                .subscribe((results:String[]) => {
                    this.loader_WeaponRunes = results;
                    this.finish_WeaponRunes()
                });
        }
    }

    finish_ItemProperties() {
        if (this.loader_ItemProperties) {
            this.itemProperties = this.loader_ItemProperties.map(element => Object.assign(new ItemProperty(), element));
            this.loader_ItemProperties = [];
        }
        if (this.loading_ItemProperties) {this.loading_ItemProperties = false;}
    }

    finish_Specializations() {
        if (this.loader_Specializations) {
            this.specializations = this.loader_Specializations.map(element => Object.assign(new Specialization(), element));
            this.loader_Specializations = [];
        }
        if (this.loading_Specializations) {this.loading_Specializations = false;}
    }

    finish_Weapons() {
        if (this.loader_Weapons) {
            this.items.weapons = this.loader_Weapons.map(element => this.initialize_Item(Object.assign(new Weapon(), element), true));
            this.loader_Weapons = [];
        }
        if (this.loading_Weapons) {this.loading_Weapons = false;}
    }

    finish_Armors() {
        if (this.loader_Armors) {
            this.items.armors = this.loader_Armors.map(element => this.initialize_Item(Object.assign(new Armor(), element), true));
            this.loader_Armors = [];
        }
        if (this.loading_Armors) {this.loading_Armors = false;}
    }

    finish_Shields() {
        if (this.loader_Shields) {
            this.items.shields = this.loader_Shields.map(element => this.initialize_Item(Object.assign(new Shield(), element), true));
            this.loader_Shields = [];
        }
        if (this.loading_Shields) {this.loading_Shields = false;}
    }

    finish_WornItems() {
        if (this.loader_WornItems) {
            this.items.wornitems = this.loader_WornItems.map(element => this.initialize_Item(Object.assign(new WornItem(), element), true));
            this.loader_WornItems = [];
        }
        if (this.loading_WornItems) {this.loading_WornItems = false;}
    }

    finish_HeldItems() {
        if (this.loader_HeldItems) {
            this.items.helditems = this.loader_HeldItems.map(element => this.initialize_Item(Object.assign(new HeldItem(), element), true));
            this.loader_HeldItems = [];
        }
        if (this.loading_HeldItems) {this.loading_HeldItems = false;}
    }

    finish_AlchemicalElixirs() {
        if (this.loader_AlchemicalElixirs) {
            this.items.alchemicalelixirs = this.loader_AlchemicalElixirs.map(element => this.initialize_Item(Object.assign(new AlchemicalElixir(), element), true));
            this.loader_AlchemicalElixirs = [];
        }
        if (this.loading_AlchemicalElixirs) {this.loading_AlchemicalElixirs = false;}
    }

    finish_Potions() {
        if (this.loader_Potions) {
            this.items.potions = this.loader_Potions.map(element => this.initialize_Item(Object.assign(new Potion(), element), true));
            this.loader_Potions = [];
        }
        if (this.loading_Potions) {this.loading_Potions = false;}
    }

    finish_OtherConsumables() {
        if (this.loader_OtherConsumables) {
            this.items.otherconsumables = this.loader_OtherConsumables.map(element => this.initialize_Item(Object.assign(new OtherConsumable(), element), true));
            this.loader_OtherConsumables = [];
        }
        if (this.loading_OtherConsumables) {this.loading_OtherConsumables = false;}
    }

    finish_AdventuringGear() {
        if (this.loader_AdventuringGear) {
            this.items.adventuringgear = this.loader_AdventuringGear.map(element => this.initialize_Item(Object.assign(new AdventuringGear(), element), true));
            this.loader_AdventuringGear = [];
        }
        if (this.loading_AdventuringGear) {this.loading_AdventuringGear = false;}
    }

    finish_ArmorRunes() {
        if (this.loader_ArmorRunes) {
            this.items.armorrunes = this.loader_ArmorRunes.map(element => this.initialize_Item(Object.assign(new ArmorRune(), element), true));
            this.loader_ArmorRunes = [];
        }
        if (this.loading_ArmorRunes) {this.loading_ArmorRunes = false;}
    }

    finish_WeaponRunes() {
        if (this.loader_WeaponRunes) {
            this.items.weaponrunes = this.loader_WeaponRunes.map(element => this.initialize_Item(Object.assign(new WeaponRune(), element), true));
            this.loader_WeaponRunes = [];
        }
        if (this.loading_WeaponRunes) {this.loading_WeaponRunes = false;}
    }

}