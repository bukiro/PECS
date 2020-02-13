import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from './Character';
import { Skill } from './Skill';
import { Observable } from 'rxjs';
import { Item } from './Item';
import { Class } from './Class';
import { AbilitiesService } from './abilities.service';
import { SkillsService } from './skills.service';
import { Level } from './Level';
import { ClassesService } from './classes.service';
import { ItemCollection } from './ItemCollection';
import { Armor } from './Armor';
import { Weapon } from './Weapon';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {

    private me: Character = new Character();
    private loader = [];
    private loading: Boolean = false;
    private basicItems: Item[] = []

    itemsMenuState: string = 'out';

    constructor(
        private http: HttpClient,
        private abilitiesService: AbilitiesService,
        private skillsService: SkillsService,
        private classesService: ClassesService
    ) { }

    still_loading() {
        return this.loading;
    }

    toggleCharacterMenu(position: string = "") {
        if (position) {
            this.itemsMenuState = position;
        } else {
            this.itemsMenuState = (this.itemsMenuState == 'out') ? 'in' : 'out';
        }
    }

    get_characterMenuState() {
        return this.itemsMenuState;
    }

    get_Character() {
        return this.me;
    }

    load_Character(charName: string): Observable<string[]>{
        return this.http.get<string[]>('/assets/'+charName+'.json');
    }

    get_Classes(name: string) {
        return this.classesService.get_Classes(name);
    }

    changeClass(newClass: Class) {
        this.me.class = new Class();
        this.me.class = Object.assign({}, JSON.parse(JSON.stringify(newClass)));
    }

    get_InventoryItems() {
        if (!this.still_loading()) {
            return this.me.inventory;
        } else { return new ItemCollection() }
    }

    grant_InventoryItem(item: Item) {
        let newInventoryItem: Item;
        newInventoryItem = Object.assign({}, item);
        newInventoryItem.equip = true;
        let newInventoryLength = this.me.inventory[item.type].push(newInventoryItem);
        this.onEquipChange(this.me.inventory[item.type][newInventoryLength-1]);
    }

    drop_InventoryItem(item: Item) {

        this.me.inventory[item.type] = this.me.inventory[item.type].filter(any_item => any_item !== item);
        this.equip_basicItems();
    }

    onEquipChange(item: Item) {
        if (item.equip) {
            if (item.type == "armor"||item.type == "shield") {
                let allOfType = this.get_InventoryItems()[item.type];
                allOfType.forEach(typeItem => {
                    typeItem.equip = false;
                });
                item.equip = true;
            }
        } else {
            //If this is called by a checkbox, it finishes before the checkbox model finalizes - so if the unequipped item is the basic item, it will still end up unequipped.
            //We get around this by setting a miniscule timeout and letting the model finalize before equipping basic items.
            setTimeout(() => {
                this.equip_basicItems();                
            });
            
        }
    }

    grant_basicItems(weapon: Item, armor: Item) {
        this.basicItems = [];
        let newBasicWeapon:Item;
        newBasicWeapon = Object.assign({}, weapon);
        this.basicItems.push(newBasicWeapon);
        let newBasicArmor:Item;
        newBasicArmor = Object.assign({}, armor);
        this.basicItems.push(newBasicArmor);
        this.equip_basicItems()
    }
    
    equip_basicItems() {
        if (!this.still_loading() && this.basicItems.length) {
            if (!this.get_InventoryItems().weapon.length) {
                this.grant_InventoryItem(this.basicItems[0]);
            }
            if (!this.get_InventoryItems().armor.length) {
                this.grant_InventoryItem(this.basicItems[1]);
            }
            if (!this.get_InventoryItems().weapon.filter(weapon => weapon.equip == true).length) {
                this.get_InventoryItems().weapon[0].equip = true;
            }
            if (!this.get_InventoryItems().armor.filter(armor => armor.equip == true).length) {
                this.get_InventoryItems().armor[0].equip = true;
            }
        }
    }

    remove_Lore(oldLore: Skill) {
        this.me.lore = this.me.lore.filter(lore => lore !== oldLore);
    }

    get_Abilities(name: string = "") {
        return this.abilitiesService.get_Abilities(name)
    }

    get_Skills(name: string = "", type: string = "") {
        return this.skillsService.get_Skills(this.me.lore, name, type)
    }

    initialize(charName: string) {
        this.loading = true;
        this.load_Character(charName)
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
    }

    finish_loading() {
        if (this.loader) {
            this.me = Object.assign(new Character(), JSON.parse(JSON.stringify(this.loader)));

            this.me.lore = this.me.lore.map(lore => Object.assign(new Skill(), lore));
            
            if (this.me.class) {
                this.me.class = Object.assign(new Class(), this.me.class);
                this.me.class.levels = this.me.class.levels.map(level => Object.assign(new Level(), level));
            } else {
                this.me.class = new Class();
            }
            if (this.me.inventory) {
                this.me.inventory = Object.assign(new ItemCollection(), this.me.inventory);
                this.me.inventory.weapon = this.me.inventory.weapon.map(weapon => Object.assign(new Weapon(), weapon));
                this.me.inventory.armor = this.me.inventory.armor.map(armor => Object.assign(new Armor(), armor));
                this.me.inventory.shield = this.me.inventory.shield.map(shield => Object.assign(new Weapon(), shield));
            } else {
                this.me.inventory = new ItemCollection();
            }

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
        this.equip_basicItems();
    }

    print() {
        console.log(JSON.stringify(this.me));
    }

    ngOnInit() {

    }

}