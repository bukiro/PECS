import { Injectable } from '@angular/core';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
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
import { v4 as uuidv4 } from 'uuid';
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
import { Oil } from './Oil';
import { Talisman } from './Talisman';
import { SpellsService } from './spells.service';
import { SpellCast } from './SpellCast';
import { AlchemicalBomb } from './AlchemicalBomb';
import { AlchemicalTool } from './AlchemicalTool';
import { Snare } from './Snare';
import { WeaponMaterial } from './WeaponMaterial';
import { AlchemicalPoison } from './AlchemicalPoison';
import { OtherConsumableBomb } from './OtherConsumableBomb';
import { Wand } from './Wand';
import { ConditionsService } from './conditions.service';
import * as json_itemproperties from '../assets/json/itemproperties';
import * as json_armormaterials from '../assets/json/armormaterials';
import * as json_shieldmaterials from '../assets/json/shieldmaterials';
import * as json_weaponmaterials from '../assets/json/weaponmaterials';
import * as json_specializations from '../assets/json/specializations';
import * as json_adventuringgear from '../assets/json/items/adventuringgear';
import * as json_alchemicalbombs from '../assets/json/items/alchemicalbombs';
import * as json_alchemicalelixirs from '../assets/json/items/alchemicalelixirs';
import * as json_alchemicaltools from '../assets/json/items/alchemicaltools';
import * as json_alchemicalpoisons from '../assets/json/items/alchemicalpoisons';
import * as json_ammunition from '../assets/json/items/ammunition';
import * as json_armorrunes from '../assets/json/items/armorrunes';
import * as json_armors from '../assets/json/items/armors';
import * as json_helditems from '../assets/json/items/helditems';
import * as json_oils from '../assets/json/items/oils';
import * as json_otherconsumables from '../assets/json/items/otherconsumables';
import * as json_otherconsumablesbombs from '../assets/json/items/otherconsumablesbombs';
import * as json_potions from '../assets/json/items/potions';
import * as json_scrolls from '../assets/json/items/scrolls';
import * as json_shields from '../assets/json/items/shields';
import * as json_snares from '../assets/json/items/snares';
import * as json_talismans from '../assets/json/items/talismans';
import * as json_wands from '../assets/json/items/wands';
import * as json_weaponrunes from '../assets/json/items/weaponrunes';
import * as json_weapons from '../assets/json/items/weapons';
import * as json_wornitems from '../assets/json/items/wornitems';
import { Creature } from './Creature';
import { ToastService } from './toast.service';
import { ArmorMaterial } from './ArmorMaterial';
import { ShieldMaterial } from './ShieldMaterial';
import { Hint } from './Hint';
import { InventoryComponent } from './inventory/inventory.component';
import { NewItemPropertyComponent } from './items/newItemProperty/newItemProperty.component';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: ItemCollection;
    private cleanItems: ItemCollection;
    private craftingItems: ItemCollection;
    private itemProperties: ItemProperty[] = [];
    private armorMaterials: ArmorMaterial[] = [];
    private shieldMaterials: ArmorMaterial[] = [];
    private weaponMaterials: WeaponMaterial[] = [];
    private specializations: Specialization[] = [];
    private loading: boolean = false;

    itemsMenuState: string = 'out';

    constructor(
        private savegameService: SavegameService,
        private toastService: ToastService
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

    get_CleanItems() {
        if (!this.still_loading()) {
            return this.cleanItems;
        } else { return new ItemCollection }
    }

    get_CraftingItems() {
        if (!this.still_loading()) {
            return this.craftingItems;
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

    get_CraftingItemByID(id: string) {
        if (!this.still_loading()) {
            return this.craftingItems.allItems().find(item => item.id == id);
        } else { return null }
    }

    get_ItemProperties() {
        if (!this.still_loading()) {
            return this.itemProperties;
        } else { return [new ItemProperty] }
    }

    get_ArmorMaterials() {
        if (!this.still_loading()) {
            return this.armorMaterials;
        } else { return [new ArmorMaterial] }
    }

    get_ShieldMaterials() {
        if (!this.still_loading()) {
            return this.shieldMaterials;
        } else { return [new ShieldMaterial] }
    }

    get_WeaponMaterials() {
        if (!this.still_loading()) {
            return this.weaponMaterials;
        } else { return [new WeaponMaterial] }
    }

    get_Specializations(group: string = "") {
        if (!this.still_loading()) {
            return this.specializations.filter(spec => spec.name.toLowerCase() == group.toLowerCase() || group == "");
        } else { return [new Specialization] }
    }

    get_ItemsOfType(type: string, name: string = "") {
        if (!this.still_loading()) {
            return this.cleanItems[type].filter(item => item.name.toLowerCase() == name.toLowerCase() || name == "");
        } else { return [] }
    }

    get_CleanItemsOfType(type: string, name: string = "") {
        if (!this.still_loading()) {
            return this.items[type].filter(item => item.name.toLowerCase() == name.toLowerCase() || name == "");
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
                case "alchemicalbombs":
                    return Object.assign(new AlchemicalBomb(), item);
                case "alchemicalpoisons":
                    return Object.assign(new AlchemicalPoison(), item);
                case "alchemicaltools":
                    return Object.assign(new AlchemicalTool(), item);
                case "potions":
                    return Object.assign(new Potion(), item);
                case "otherconsumables":
                    return Object.assign(new OtherConsumable(), item);
                case "otherconsumablesbombs":
                    return Object.assign(new OtherConsumableBomb(), item);
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
                case "oils":
                    return Object.assign(new Oil(), item);
                case "talismans":
                    return Object.assign(new Talisman(), item);
                case "snares":
                    return Object.assign(new Snare(), item);
                case "wands":
                    return Object.assign(new Snare(), item);
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
                case "AlchemicalBomb":
                    return Object.assign(new AlchemicalBomb(), item);
                case "AlchemicalPoison":
                    return Object.assign(new AlchemicalPoison(), item);
                case "AlchemicalTool":
                    return Object.assign(new AlchemicalTool(), item);
                case "Potion":
                    return Object.assign(new Potion(), item);
                case "OtherConsumable":
                    return Object.assign(new OtherConsumable(), item);
                case "OtherConsumableBomb":
                    return Object.assign(new OtherConsumableBomb(), item);
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
                case "Oil":
                    return Object.assign(new Oil(), item);
                case "Talisman":
                    return Object.assign(new Talisman(), item);
                case "Snare":
                    return Object.assign(new Snare(), item);
                case "Wand":
                    return Object.assign(new Wand(), item);
            }
        } else if (item.type) {
            return this.cast_ItemByType(item)
        } else {
            return item;
        }

    }

    initialize_Item(item: any, preassigned: boolean = false, newId: boolean = true, resetPropertyRunes: boolean = false) {
        //Every new item has to be re-assigned its class and iterate over all its objects to reassign them as well.
        //Typescript does not seem to have the option to keep object properties' classes when assigning.
        let newItem: any;
        //Set preassigned if you have already given the item a Class. Otherwise it will be determined by the item's type.
        if (preassigned) {
            newItem = Object.assign(new item.constructor(), JSON.parse(JSON.stringify(item)));
        } else {
            newItem = this.cast_ItemByType(JSON.parse(JSON.stringify(item)));
        }
        if (newId) {
            newItem.id = uuidv4();
            newItem.activities?.forEach((activity: ItemActivity) => {
                activity.castSpells?.forEach(cast => {
                    if (cast.spellGain) {
                        cast.spellGain.id = uuidv4();
                    }
                })
            })
        }
        newItem = this.savegameService.reassign(newItem, "", this);
        if (newItem.gainActivities) {
            (newItem as Equipment).gainActivities.forEach((gain: ActivityGain) => {
                gain.source = newItem.id;
            });
        }
        if (newItem.activities) {
            (newItem as Equipment).activities.forEach((activity: ItemActivity) => {
                activity.source = newItem.id;
            });
        }
        if (newItem.storedSpells) {
            (newItem as Item).storedSpells.forEach((choice: SpellChoice, index) => {
                choice.source = newItem.id;
                choice.id = "0-Spell-" + newItem.id + index;
            });
        }
        //For items (oils) that apply the same effect as a rune, load the rune into the item here.
        if (newItem.runeEffect && newItem.runeEffect.name) {
            let rune = this.cleanItems.weaponrunes.find(rune => rune.name == newItem.runeEffect.name);
            if (rune) {
                newItem.runeEffect = Object.assign(new WeaponRune(), JSON.parse(JSON.stringify(rune)));
                this.savegameService.reassign(newItem.runeEffect, "", this);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += " (" + newItem.name + ")" });
            }
        }
        //For base items that come with property Runes with name only, load the rune into the item here.
        if (resetPropertyRunes && (newItem instanceof Weapon || newItem.moddable == "weapon") && newItem.propertyRunes?.length) {
            let newRunes: WeaponRune[] = [];
            newItem.propertyRunes.forEach((rune: WeaponRune) => {
                let libraryItem = this.cleanItems.weaponrunes.find(newrune => newrune.name == rune.name)
                if (libraryItem) {
                    newRunes.push(this.savegameService.merge(libraryItem, rune))
                }
            })
            newItem.propertyRunes = newRunes;
        }
        if (resetPropertyRunes && (newItem instanceof Armor || newItem.moddable == "armor") && newItem.propertyRunes?.length) {
            let newRunes: ArmorRune[] = [];
            newItem.propertyRunes.forEach((rune: ArmorRune) => {
                let libraryItem = this.cleanItems.armorrunes.find(newrune => newrune.name == rune.name)
                if (libraryItem) {
                    newRunes.push(this.savegameService.merge(libraryItem, rune))
                }
            })
            newItem.propertyRunes = newRunes;
        }
        //Recast and disable all hints.
        if ((newItem as Equipment).hints?.length) {
            newItem.hints = (newItem as Equipment).hints.map(hint => Object.assign(new Hint(), hint));
            (newItem as Equipment).hints.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            })
        }
        if ((newItem as Equipment).propertyRunes?.length) {
            (newItem as Equipment).propertyRunes.forEach(rune => {
                rune.hints = rune.hints.map(hint => Object.assign(new Hint(), hint));
                rune.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
        if ((newItem as Equipment).oilsApplied?.length) {
            (newItem as Equipment).oilsApplied.forEach(oil => {
                oil.hints = oil.hints.map(hint => Object.assign(new Hint(), hint));
                oil.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
        if ((newItem as Equipment).material?.length) {
            (newItem as Equipment).material.forEach(material => {
                material.hints = material.hints.map(hint => Object.assign(new Hint(), hint));
                material.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }

        return newItem;
    }

    get_RealBulk(item: Item, carrying: boolean = false) {
        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
        let itemBulk = 0;
        //Use the item's carrying bulk if carrying is true.
        let bulkString = (carrying && (item as Equipment).carryingBulk) ? (item as Equipment).carryingBulk : item.get_Bulk()
        switch (bulkString) {
            case "":
                    break;
                case "-":
                    break;
                case "L":
                    if (item.amount) {
                        itemBulk += Math.floor(item.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                    } else {
                        itemBulk += 1;
                    }
                    break;
                default:
                    if (item.amount) {
                        itemBulk += parseInt(bulkString) * 10 * Math.floor(item.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                    } else {
                        itemBulk += parseInt(bulkString) * 10;
                    }
                    break;
        }
        itemBulk = Math.floor(itemBulk) / 10;
        return itemBulk;
    }

    update_GrantingItem(creature: Character | AnimalCompanion, item: Item) {
        //If this item has granted other items, check how many of those still exist, and update the item's granting list.
        item.gainItems?.forEach(itemGain => {
            let found: number = 0;
            creature.inventories.forEach(inventory => {
                //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                inventory[itemGain.type].filter(invItem => invItem.id == itemGain.id || (invItem.can_Stack() && invItem.name == itemGain.name)).forEach(invItem => {
                    found += invItem.amount;
                    //Take the opportunity to update this item as well, in case it grants further items.
                    //Ideally, the granting items should not contain the same kind of stackable items, or the numbers will be wrong.
                    this.update_GrantingItem(creature, invItem);
                })
            })
            if (found < itemGain.amount) {
                itemGain.amount = found;
            }
        })
        return item;
    }

    move_GrantedItems(creature: Character | AnimalCompanion, item: Item, targetInventory: ItemCollection, inventory: ItemCollection, characterService: CharacterService) {
        //If you are moving an item that grants other items, move those as well.
        //Only move items from inventories other than the target inventory, and start from the same inventory that the granting item is in.
        //If any of the contained items contain the the target inventory, that should be caught in move_InventoryItem.
        item.gainItems?.forEach(itemGain => {
            let toMove: number = itemGain.amount;
            [inventory].concat(creature.inventories.filter(inv => inv !== targetInventory && inv !== inventory)).forEach(inv => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then move as many of them into the new inventory as the amount demands.
                inv[itemGain.type].filter(invItem => invItem.id == itemGain.id || (invItem.can_Stack() && invItem.name == itemGain.name)).forEach(invItem => {
                    if (toMove) {
                        let moved = Math.min(toMove, invItem.amount);
                        toMove -= moved;
                        this.move_InventoryItem(creature, invItem, targetInventory, inv, characterService, moved);
                    }
                })
            })
        })
    }

    move_InventoryItem(creature: Character | AnimalCompanion, item: Item, targetInventory: ItemCollection, inventory: ItemCollection, characterService: CharacterService, amount: number = 0) {
        if (targetInventory && targetInventory != inventory && targetInventory.itemId != item.id) {
            item = this.update_GrantingItem(creature, item);
            let fromCreature = characterService.get_Creatures().find(creature => creature.inventories.find(inv => inv === inventory)) as Character | AnimalCompanion;
            let toCreature = characterService.get_Creatures().find(creature => creature.inventories.find(inv => inv === targetInventory)) as Character | AnimalCompanion;
            if (!amount) {
                amount = item.amount;
            }
            if (fromCreature == toCreature) {
                //If this item is moved between inventories of the same creature, you don't need to drop it explicitly.
                //Just push it to the new inventory and remove it from the old, but unequip it either way.
                let movedItem = JSON.parse(JSON.stringify(item));
                movedItem = characterService.reassign(movedItem);
                //If the item is stackable, and a stack already exists in the target inventory, just add the amount to the stack.
                if (movedItem.can_Stack()) {
                    let targetItem = targetInventory[item.type].find(invItem => invItem.name == movedItem.name)
                    if (targetItem) {
                        targetItem.amount += amount;
                    } else {
                        targetInventory[item.type].push(movedItem);
                    }
                } else {
                    targetInventory[item.type].push(movedItem);
                }
                //If the amount is higher or exactly the same, remove the item from the old inventory. If not, reduce the amount on the old item, then set that amount on the new item.
                if (amount >= item.amount) {
                    inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item)
                } else {
                    movedItem.amount = amount;
                    item.amount -= amount;
                }
                if ((movedItem as Equipment).equipped) {
                    characterService.onEquip(creature, inventory, movedItem as Equipment, false)
                }
                if ((movedItem as Equipment).invested) {
                    characterService.on_Invest(creature, inventory, movedItem as Equipment, false)
                }
                //Move all granted items as well.
                this.move_GrantedItems(creature, movedItem, targetInventory, inventory, characterService);
            } else {
                let movedItem = JSON.parse(JSON.stringify(item));
                let movedInventories: ItemCollection[]
                //If this item is a container and is moved between creatures, the attached inventories need to be moved as well.
                //Because we lose the inventory when we drop the item, but automatically gain one when we grant the item to the other creature,
                // we need to first save the inventory, then recreate it and remove the new ones after moving the item.
                //Here, we save the inventories and take care of any containers within the container.
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    //First, move all inventory granting items within this inventory granting item to the same target.
                    fromCreature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                        inv.allItems().filter(invItem => (invItem as Equipment).gainInventory?.length).forEach(invItem => {
                            this.move_InventoryItem(creature, invItem, targetInventory, inv, characterService);
                        });
                    });
                    movedInventories = fromCreature.inventories.filter(inv => inv.itemId == item.id).map(inv => JSON.parse(JSON.stringify(inv)))
                    movedInventories = movedInventories.map(inv => characterService.reassign(inv));
                }
                let newItem = characterService.grant_InventoryItem(toCreature, targetInventory, movedItem, false, false, false, movedItem.amount, false);
                characterService.drop_InventoryItem(fromCreature, inventory, item, false, true, true, item.amount);
                //Below, we reinsert the saved inventories and remove any newly created ones.
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    toCreature.inventories = toCreature.inventories.filter(inv => inv.itemId != newItem.id);
                    let newLength = toCreature.inventories.push(...movedInventories);
                    toCreature.inventories.slice(newLength - movedInventories.length, newLength).forEach(inv => {
                        inv.itemId = newItem.id;
                    })
                }
                if ((newItem as Equipment).equipped) {
                    characterService.onEquip(creature, targetInventory, newItem as Equipment, false)
                }
                if ((newItem as Equipment).invested) {
                    characterService.on_Invest(creature, targetInventory, newItem as Equipment, false)
                }
            }

        }
        //Update any gridicons that have changed.
        characterService.set_Changed(item.id);

    }

    process_Consumable(creature: Creature, characterService: CharacterService, itemsService: ItemsService, conditionsService: ConditionsService, spellsService: SpellsService, item: Consumable) {

        //Consumables don't do anything in manual mode, except be used up.
        if (!characterService.get_ManualMode()) {

            //One time effects
            if (item.onceEffects) {
                item.onceEffects.forEach(effect => {
                    characterService.process_OnceEffect(creature, effect);
                })
            }

            //Apply conditions
            if (item["gainConditions"]) {
                item["gainConditions"].forEach(gain => {
                    let newConditionGain = Object.assign(new ConditionGain(), gain);
                    characterService.add_Condition(creature, newConditionGain, false);
                });
            }

            //Cast Spells
            if (item["castSpells"]) {
                item["castSpells"].forEach((cast: SpellCast) => {
                    cast.spellGain.duration = cast.duration;
                    let librarySpell = spellsService.get_Spells(cast.name)[0];
                    if (librarySpell) {
                        spellsService.process_Spell(creature, creature.type, characterService, itemsService, conditionsService, null, cast.spellGain, librarySpell, cast.level, true, true, false);
                    }
                })
            }

            //Gain Items on Activation
            if (item.gainItems.length && creature.type != "Familiar") {
                item.gainItems.forEach(gainItem => {
                    let newItem: Item = itemsService.get_CleanItems()[gainItem.type].filter((libraryItem: Item) => libraryItem.name.toLowerCase() == gainItem.name.toLowerCase())[0];
                    if (newItem) {
                        let grantedItem = characterService.grant_InventoryItem(creature as Character | AnimalCompanion, creature.inventories[0], newItem, false, false, true);
                        gainItem.id = grantedItem.id;
                        grantedItem.expiration = gainItem.expiration;
                        if (grantedItem.get_Name) {
                            grantedItem.grantedBy = "(Granted by " + item.name + ")";
                        };
                    } else {
                        this.toastService.show("Failed granting " + gainItem.type + " " + gainItem.name + " - item not found.", [], characterService)
                    }
                });
            }

        }

    }

    rest(creature: Character | AnimalCompanion, characterService: CharacterService) {
        creature.inventories.forEach(inv => {
            inv.allItems().filter(item => item.expiration == -2).forEach(item => {
                item.name = "DELETE";
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().some(item => item.name == "DELETE")) {
                inv.allItems().filter(item => item.name == "DELETE").forEach(item => {
                    characterService.drop_InventoryItem(creature, inv, item, false, true, true, item.amount);
                })
                characterService.set_ToChange(creature.type, "inventory");
            }
        })
        if (creature.type == "Character") {
            let character = creature as Character;
            //If you have Scroll Savant, get a copy of each prepared scroll that lasts until the next rest.
            if (character.get_FeatsTaken(1, character.level, "Scroll Savant").length) {
                character.class.spellCasting.filter(casting => casting.scrollSavant.length).forEach(casting => {
                    casting.scrollSavant.forEach(scroll => {
                        characterService.grant_InventoryItem(character, character.inventories[0], scroll, false, false, false);
                    });
                });
            }

            //If you have Battleforger, all your battleforged items are reset.
            if (character.get_FeatsTaken(1, character.level, "Battleforger").length) {
                let attacksChanged: boolean = false;
                let defenseChanged: boolean = false;
                character.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        if (weapon.battleforged) {
                            attacksChanged = true;
                        }
                        weapon.battleforged = false;
                    })
                    inv.armors.forEach(armor => {
                        if (armor.battleforged) {
                            defenseChanged = true;
                        }
                        armor.battleforged = false;
                    })
                    inv.wornitems.forEach(wornitem => {
                        if (wornitem.battleforged) {
                            attacksChanged = true;
                        }
                        wornitem.battleforged = false;
                    })
                })
                if (attacksChanged) {
                    characterService.set_ToChange("Character", "attacks");
                }
                if (defenseChanged) {
                    characterService.set_ToChange("Character", "defense");
                }
            }

            //For feats that grant you an item on rest, grant these here and set an expiration until the next rest.
            characterService.featsService.get_All(creature.customFeats)
                .filter(feat => feat.gainItems.find(gain => gain.on == "rest") && feat.have(creature, characterService, creature.level))
                .forEach(feat => {
                    feat.gainItems.filter(gain => gain.on == "rest").forEach(gainItem => {
                        let newItem: Item = this.get_CleanItemsOfType(gainItem.type, gainItem.name)[0];
                        let grantedItem: Item;
                        if (newItem && newItem.can_Stack() && (gainItem.amount + (gainItem.amountPerLevel * creature.level))) {
                            grantedItem = characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, true, false, false, (gainItem.amount + (gainItem.amountPerLevel * creature.level)), undefined, -2);
                        } else if (newItem) {
                            grantedItem = characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, true, false, true, 1, undefined, -2);
                        }
                    });
                });
        }
    }

    refocus(creature: Character | AnimalCompanion, characterService: CharacterService) {
        creature.inventories.forEach(inv => {
            inv.allItems().filter(item => item.expiration == -3).forEach(item => {
                item.name = "DELETE";
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().some(item => item.name == "DELETE")) {
                inv.allItems().filter(item => item.name == "DELETE").forEach(item => {
                    characterService.drop_InventoryItem(creature, inv, item, false, true, true, item.amount);
                })
                characterService.set_ToChange(creature.type, "inventory");
            }
        })
    }

    tick_Items(creature: Character | AnimalCompanion, characterService: CharacterService, turns: number) {
        creature.inventories.forEach(inv => {
            //Tick down and remove all items that expire.
            inv.allItems().filter(item => item.expiration > 0).forEach(item => {
                item.expiration -= turns;
                if (item.expiration <= 0) {
                    item.name = "DELETE";
                    if ((item as Equipment).baseType == "Equipment" && (item as Equipment).gainInventory.length) {
                        //If a temporary container is destroyed, return all contained items to the main inventory.
                        creature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                            inv.allItems().forEach(invItem => {
                                this.move_InventoryItem(creature, invItem, creature.inventories[0], inv, characterService);
                            });
                        });
                    }
                }
                characterService.set_ToChange(creature.type, "inventory");
                if (item instanceof Shield && item.equipped) {
                    characterService.set_ToChange(creature.type, "attacks");
                }
                if ((item instanceof Armor || item instanceof Shield) && item.equipped) {
                    characterService.set_ToChange(creature.type, "defense");
                }
            })
            inv.wands.filter(wand => wand.cooldown > 0).forEach(wand => {
                wand.cooldown = Math.max(wand.cooldown - turns, 0);
                characterService.set_ToChange(creature.type, "inventory");
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().some(item => item.name == "DELETE")) {
                inv.allItems().filter(item => item.name == "DELETE").forEach(item => {
                    characterService.drop_InventoryItem(creature, inv, item, false, true, true, item.amount);
                })
                characterService.set_ToChange(creature.type, "inventory");
            }
            inv.allItems().filter(item => item.oilsApplied && item.oilsApplied.length).forEach(item => {
                item.oilsApplied.filter(oil => oil.duration != -1).forEach(oil => {
                    oil.duration -= turns;
                    if (oil.duration <= 0) {
                        oil.name = "DELETE";
                    }
                    characterService.set_ToChange(creature.type, "inventory");
                    if (item instanceof Weapon && item.equipped) {
                        characterService.set_ToChange(creature.type, "attacks");
                    }
                    if ((item instanceof Armor || item instanceof Shield) && item.equipped) {
                        characterService.set_ToChange(creature.type, "defense");
                    }
                })
                item.oilsApplied = item.oilsApplied.filter(oil => oil.name != "DELETE");
            });
        });
    }

    still_loading() {
        return this.loading;
    }

    initialize(reset: boolean = true) {
        if (!this.items || reset) {
            this.loading = true;
            this.load(json_itemproperties, "itemProperties", ItemProperty, "meta");
            this.load(json_armormaterials, "armorMaterials", ArmorMaterial, "meta");
            this.load(json_shieldmaterials, "shieldMaterials", ShieldMaterial, "meta");
            this.load(json_weaponmaterials, "weaponMaterials", WeaponMaterial, "meta");
            this.load(json_specializations, "specializations", Specialization, "meta");

            this.items = new ItemCollection();
            this.cleanItems = new ItemCollection();
            this.craftingItems = new ItemCollection();

            //Runes need to load before other items, because they are loaded into the items.
            this.load(json_armorrunes, "armorrunes", ArmorRune, "item");
            this.load(json_weaponrunes, "weaponrunes", WeaponRune, "item");
            //Oils need to load after WeaponRunes, because they have to copy some of them.
            this.load(json_oils, "oils", Oil, "item");

            this.load(json_weapons, "weapons", Weapon, "item");
            this.load(json_armors, "armors", Armor, "item");
            this.load(json_shields, "shields", Shield, "item");
            this.load(json_wornitems, "wornitems", WornItem, "item");
            this.load(json_helditems, "helditems", HeldItem, "item");
            this.load(json_ammunition, "ammunition", Ammunition, "item");
            this.load(json_alchemicalelixirs, "alchemicalelixirs", AlchemicalElixir, "item");
            this.load(json_potions, "potions", Potion, "item");
            this.load(json_otherconsumables, "otherconsumables", OtherConsumable, "item");
            this.load(json_otherconsumablesbombs, "otherconsumablesbombs", OtherConsumableBomb, "item");
            this.load(json_adventuringgear, "adventuringgear", AdventuringGear, "item");
            this.load(json_scrolls, "scrolls", Scroll, "item");
            this.load(json_talismans, "talismans", Talisman, "item");
            this.load(json_alchemicalbombs, "alchemicalbombs", AlchemicalBomb, "item");
            this.load(json_alchemicaltools, "alchemicaltools", AlchemicalTool, "item");
            this.load(json_snares, "snares", Snare, "item");
            this.load(json_alchemicalpoisons, "alchemicalpoisons", AlchemicalPoison, "item");
            this.load(json_wands, "wands", Wand, "item");

            /*
            this.load(json_REPLACE0, "REPLACE0", REPLACE1, "item");
            */
            this.loading = false;

        } else {
            //Disable any active hint effects when loading a character, and reinitialize the hints.
            this.specializations.forEach(spec => {
                spec.hints = spec.hints.map(hint => Object.assign(new Hint(), hint));
                spec.hints?.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
    }

    load(source, target: string, type, category: "item" | "meta") {
        switch (category) {
            case "item":
                this.items[target] = [];
                this.cleanItems[target] = [];
                this.craftingItems[target] = [];
                Object.keys(source).forEach(key => {
                    this.items[target].push(...source[key].map(obj => this.initialize_Item(Object.assign(new type(), obj), true, false, true)));
                    this.cleanItems[target].push(...source[key].map(obj => this.initialize_Item(Object.assign(new type(), obj), true, false, true)));
                    this.craftingItems[target].push(...source[key].map(obj => this.initialize_Item(Object.assign(new type(), obj), true, false, true)));
                });

                let duplicates: string[] = Array.from(new Set(
                    this.items[target]
                        .filter((item: Item) =>
                            this.items[target].filter((otherItem: Item) =>
                                otherItem.id == item.id
                            ).length > 1
                        ).map((item: Item) => item.id)
                ));
                duplicates.forEach((itemID) => {
                    let highestPriority = Math.max(
                        ...this.items[target]
                            .filter((item: Item) => item.id == itemID)
                            .map((item: Item) => item.overridePriority)
                    );
                    let highestItem = this.items[target].find((item: Item) => item.id == itemID && item.overridePriority == highestPriority);
                    this.items[target] = this.items[target].filter((item: Item) => !(item.id == itemID && item !== highestItem));
                    let highestCleanItem = this.cleanItems[target].find((item: Item) => item.id == itemID && item.overridePriority == highestPriority);
                    this.cleanItems[target] = this.cleanItems[target].filter((item: Item) => !(item.id == itemID && item !== highestCleanItem));
                    let highestCraftingItem = this.craftingItems[target].find((item: Item) => item.id == itemID && item.overridePriority == highestPriority);
                    this.craftingItems[target] = this.craftingItems[target].filter((item: Item) => !(item.id == itemID && item !== highestCraftingItem));
                })
                break;
            case "meta":
                this[target] = [];
                Object.keys(source).forEach(key => {
                    this[target].push(...source[key].map(obj => Object.assign(new type(), obj)));
                });
                break;
        }
    }

}