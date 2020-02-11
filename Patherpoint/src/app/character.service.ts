import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from './Character';
import { Skill } from './Skill';
import { Observable } from 'rxjs';
import { Item } from './Item';
import { Class } from './Class';
import { AbilitiesService } from './abilities.service';

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
        private abilitiesService: AbilitiesService
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

    load_Character(charName): Observable<String[]>{
        return this.http.get<String[]>('/assets/'+charName+'.json');
    }

    changeClass($class) {
        this.me.class = new Class();
        this.me.class = Object.assign({}, JSON.parse(JSON.stringify($class)));
    }

    get_InventoryItems(key:string = "", value = undefined, key2:string = "", value2 = undefined, key3:string = "", value3 = undefined) {
        if (!this.still_loading()) {
            let items = this.me.inventory;
            if (items) {
                if (key == "" || value == undefined) {
                    return items;
                } else {
                    items = items.filter(
                        item => item[key] == value
                        );
                    if (key2 == "" || value2 == undefined) {
                        return items;
                    } else {
                        items = items.filter(
                            item => item[key2] == value2
                            );
                        if (key3 == "" || value3 == undefined) {
                            return items;
                        } else {
                            items = items.filter(
                                item => item[key3] == value3
                                );
                            return items;
                        }
                    }
                }
            }
        }
    }

    grant_InventoryItem(item) {
        let newInventoryItem:Item;
        newInventoryItem = Object.assign({}, item);
        newInventoryItem.equip = true;
        let newInventoryLength = this.me.inventory.push(newInventoryItem);
        this.onEquipChange(this.me.inventory[newInventoryLength-1]);
    }

    drop_InventoryItem(item) {
        this.me.inventory = this.me.inventory.filter(any_item => any_item !== item);
        this.equip_basicItems();
    }

    onEquipChange(item) {
        if (item.equip) {
            if (item.type == "armor"||item.type == "shield") {
                let allOfType = this.get_InventoryItems("type", item.type);
                allOfType.forEach(typeItem => {
                    typeItem.equip = false;
                })
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
            if (!this.get_InventoryItems("type", "weapon").length) {
                this.grant_InventoryItem(this.basicItems[0]);
            }
            if (!this.get_InventoryItems("type", "armor").length) {
                this.grant_InventoryItem(this.basicItems[1]);
            }
            if (!this.get_InventoryItems("type", "weapon", "equip", true).length) {
                this.get_InventoryItems("type", "weapon")[0].equip = true;
            }
            if (!this.get_InventoryItems("type", "armor", "equip", true).length) {
                this.get_InventoryItems("type", "armor")[0].equip = true;
            }
        }
    }

    remove_Lore(skill) {
        this.me.lore.splice(skill, 1);
    }

    get_Abilities(key:string = "", value = undefined) {
        return this.abilitiesService.get_Abilities(key, value)
    }

    get_AbilityBoosts(levelNumber: number, ability) {
        if (this.me.class) {
            let boosts = [];
            if (levelNumber == 0) {
                let levels = this.me.class.levels;
                levels.forEach(level => {
                    level.abilityBoosts.filter(boost => boost.name == ability.name).forEach(boost => {
                        boosts.push(boost);
                    })
                })
            } else {
                let singleLevel = this.me.class.levels.filter(level => level.number == levelNumber )[0]
                singleLevel.abilityBoosts.filter(boost => boost.name == ability.name).forEach(boost => {
                    boosts.push(boost);
                })
            }
            return boosts;
        }
    }

    boostAbility(level, ability, boost) {
        if (boost) {
            if (level.abilityBoosts_applied < level.abilityBoosts_available) {
                level.abilityBoosts.push({"name":ability.name, "type":"boost"});
                level.abilityBoosts_applied += 1;
            }
        } else {
            let oldBoost = level.abilityBoosts.filter(boost => boost.name == ability.name)[0];
            level.abilityBoosts = level.abilityBoosts.filter(boost => boost !== oldBoost);
            level.abilityBoosts_applied -= 1;
        }
    }

    initialize(charName) {
        this.loading = true;
        this.load_Character(charName)
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
    }

    finish_loading() {
        if (this.loader) {
            this.me = new Character();
            this.me = Object.assign({}, JSON.parse(JSON.stringify(this.loader)))

            let newLore = [];
            this.me.lore.forEach(lore => {
                newLore.push(new Skill(lore.name, lore.ability))
            })
            this.me.lore = newLore;

            if (this.me.class) {
                this.me.class = <Class> this.me.class;
            } else {
                this.me.class = new Class();
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