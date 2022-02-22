import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SpellsService } from 'src/app/services/spells.service';
import { ToastService } from 'src/app/services/toast.service';
import { TypeService } from 'src/app/services/type.service';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { AlchemicalElixir } from 'src/app/classes/AlchemicalElixir';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { AlchemicalTool } from 'src/app/classes/AlchemicalTool';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Armor } from 'src/app/classes/Armor';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Character } from 'src/app/classes/Character';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Consumable } from 'src/app/classes/Consumable';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { HeldItem } from 'src/app/classes/HeldItem';
import { Item } from 'src/app/classes/Item';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { MaterialItem } from 'src/app/classes/MaterialItem';
import { Oil } from 'src/app/classes/Oil';
import { OtherConsumable } from 'src/app/classes/OtherConsumable';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Potion } from 'src/app/classes/Potion';
import { Rune } from 'src/app/classes/Rune';
import { Scroll } from 'src/app/classes/Scroll';
import { Shield } from 'src/app/classes/Shield';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { Snare } from 'src/app/classes/Snare';
import { Specialization } from 'src/app/classes/Specialization';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { Talisman } from 'src/app/classes/Talisman';
import { Wand } from 'src/app/classes/Wand';
import { Weapon } from 'src/app/classes/Weapon';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';
import { v4 as uuidv4 } from 'uuid';
import * as json_adventuringgear from 'src/assets/json/items/adventuringgear';
import * as json_alchemicalbombs from 'src/assets/json/items/alchemicalbombs';
import * as json_alchemicalelixirs from 'src/assets/json/items/alchemicalelixirs';
import * as json_alchemicalpoisons from 'src/assets/json/items/alchemicalpoisons';
import * as json_alchemicaltools from 'src/assets/json/items/alchemicaltools';
import * as json_ammunition from 'src/assets/json/items/ammunition';
import * as json_armormaterials from 'src/assets/json/armormaterials';
import * as json_armorrunes from 'src/assets/json/items/armorrunes';
import * as json_armors from 'src/assets/json/items/armors';
import * as json_helditems from 'src/assets/json/items/helditems';
import * as json_itemproperties from 'src/assets/json/itemproperties';
import * as json_materialitems from 'src/assets/json/items/materialitems';
import * as json_oils from 'src/assets/json/items/oils';
import * as json_otherconsumables from 'src/assets/json/items/otherconsumables';
import * as json_otherconsumablesbombs from 'src/assets/json/items/otherconsumablesbombs';
import * as json_potions from 'src/assets/json/items/potions';
import * as json_scrolls from 'src/assets/json/items/scrolls';
import * as json_shieldmaterials from 'src/assets/json/shieldmaterials';
import * as json_shields from 'src/assets/json/items/shields';
import * as json_snares from 'src/assets/json/items/snares';
import * as json_specializations from 'src/assets/json/specializations';
import * as json_talismans from 'src/assets/json/items/talismans';
import * as json_wands from 'src/assets/json/items/wands';
import * as json_weaponmaterials from 'src/assets/json/weaponmaterials';
import * as json_weaponrunes from 'src/assets/json/items/weaponrunes';
import * as json_weapons from 'src/assets/json/items/weapons';
import * as json_wornitems from 'src/assets/json/items/wornitems';

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
        private typeService: TypeService,
        private toastService: ToastService,
        private extensionsService: ExtensionsService,
        private refreshService: RefreshService
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
                case "adventuringgear":
                    return Object.assign(new AdventuringGear(), item);
                case "alchemicalbombs":
                    return Object.assign(new AlchemicalBomb(), item);
                case "alchemicalelixirs":
                    return Object.assign(new AlchemicalElixir(), item);
                case "alchemicalpoisons":
                    return Object.assign(new AlchemicalPoison(), item);
                case "alchemicaltools":
                    return Object.assign(new AlchemicalTool(), item);
                case "ammunition":
                    return Object.assign(new Ammunition(), item);
                case "armorrunes":
                    return Object.assign(new ArmorRune(), item);
                case "armors":
                    return Object.assign(new Armor(), item);
                case "helditems":
                    return Object.assign(new HeldItem(), item);
                case "materialitems":
                    return Object.assign(new MaterialItem(), item);
                case "oils":
                    return Object.assign(new Oil(), item);
                case "otherconsumables":
                    return Object.assign(new OtherConsumable(), item);
                case "otherconsumablesbombs":
                    return Object.assign(new OtherConsumableBomb(), item);
                case "potions":
                    return Object.assign(new Potion(), item);
                case "scrolls":
                    return Object.assign(new Scroll(), item);
                case "shields":
                    return Object.assign(new Shield(), item);
                case "snares":
                    return Object.assign(new Snare(), item);
                case "talismans":
                    return Object.assign(new Snare(), item);
                case "wands":
                    return Object.assign(new Talisman(), item);
                case "weaponrunes":
                    return Object.assign(new WeaponRune(), item);
                case "weapons":
                    return Object.assign(new Weapon(), item);
                case "wornitems":
                    return Object.assign(new WornItem(), item);
            }
        } else {
            return item;
        }
    }

    initialize_Item(item: any, preassigned: boolean = false, newId: boolean = true, resetPropertyRunes: boolean = false) {
        //Every new item has to be re-assigned its class and iterate over its objects to reassign them as well.
        //Typescript does not seem to have the option to keep object properties' classes when assigning.
        let newItem: Item;
        //Set preassigned if you have already given the item a Class. Otherwise it will be determined by the item's type.
        if (preassigned) {
            newItem = Object.assign(new item.constructor(), JSON.parse(JSON.stringify(item)));
        } else {
            newItem = this.cast_ItemByType(JSON.parse(JSON.stringify(item)));
        }
        //Optionally, a new ID is assigned and updated on the item's activities and their spell gains.
        if (newId) {
            newItem.id = uuidv4();
            if (newItem instanceof Equipment || newItem instanceof Rune) {
                newItem.activities?.forEach((activity: ItemActivity) => {
                    activity.castSpells?.forEach(cast => {
                        if (cast.spellGain) {
                            cast.spellGain.id = uuidv4();
                        }
                    })
                })
            }
            if (newItem instanceof Equipment) {
                newItem.gainSpells?.forEach((choice: SpellChoice) => {
                    choice.id = uuidv4();
                })
            }
        }

        //Perform any merging before the item is recast.

        //For items (oils) that apply the same effect as a rune, load the rune into the item here.
        if (newItem instanceof Oil && newItem.runeEffect?.name) {
            let rune = this.cleanItems.weaponrunes.find(rune => rune.name == (newItem as Oil).runeEffect.name);
            if (rune) {
                newItem.runeEffect = Object.assign<WeaponRune, WeaponRune>(new WeaponRune(), JSON.parse(JSON.stringify(rune))).recast(this.typeService, this);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += " (" + newItem.name + ")" });
            }
        }
        //For base items that come with property Runes with name only, load the rune into the item here.
        if (resetPropertyRunes && (newItem instanceof Weapon || (newItem instanceof WornItem && newItem.isHandwrapsOfMightyBlows)) && newItem.propertyRunes?.length) {
            let newRunes: WeaponRune[] = [];
            newItem.propertyRunes.forEach((rune: WeaponRune) => {
                let libraryItem = this.cleanItems.weaponrunes.find(newrune => newrune.name == rune.name)
                if (libraryItem) {
                    newRunes.push(this.typeService.merge(libraryItem, rune))
                }
            })
            newItem.propertyRunes = newRunes;
        }
        if (resetPropertyRunes && newItem instanceof Armor && newItem.propertyRunes?.length) {
            let newRunes: ArmorRune[] = [];
            newItem.propertyRunes.forEach((rune: ArmorRune) => {
                let libraryItem = this.cleanItems.armorrunes.find(newrune => newrune.name == rune.name)
                if (libraryItem) {
                    newRunes.push(this.typeService.merge(libraryItem, rune))
                }
            })
            newItem.propertyRunes = newRunes;
        }
        //For base items that come with material with name only, load the material into the item here.
        if (resetPropertyRunes && newItem instanceof Weapon && newItem.material?.length) {
            let newMaterials: WeaponMaterial[] = [];
            newItem.material.forEach((material: WeaponMaterial) => {
                let libraryItem = this.weaponMaterials.find(newMaterial => newMaterial.name == material.name)
                if (libraryItem) {
                    newMaterials.push(this.typeService.merge(libraryItem, material))
                }
            })
            newItem.material = newMaterials;
        }
        if (resetPropertyRunes && newItem instanceof Armor && newItem.material?.length) {
            let newMaterials: ArmorMaterial[] = [];
            newItem.material.forEach((material: ArmorMaterial) => {
                let libraryItem = this.armorMaterials.find(newMaterial => newMaterial.name == material.name)
                if (libraryItem) {
                    newMaterials.push(this.typeService.merge(libraryItem, material))
                }
            })
            newItem.material = newMaterials;
        }
        if (resetPropertyRunes && newItem instanceof Shield && newItem.material?.length) {
            let newMaterials: ShieldMaterial[] = [];
            newItem.material.forEach((material: ShieldMaterial) => {
                let libraryItem = this.armorMaterials.find(newMaterial => newMaterial.name == material.name)
                if (libraryItem) {
                    newMaterials.push(this.typeService.merge(libraryItem, material))
                }
            })
            newItem.material = newMaterials;
        }

        newItem = newItem.recast(this.typeService, this);

        //Disable all hints.
        if (newItem instanceof Equipment) {
            newItem.hints.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            })
            newItem.propertyRunes.forEach(rune => {
                rune.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
            newItem.oilsApplied.forEach(oil => {
                oil.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
            newItem.material.forEach(material => {
                material.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }

        return newItem;
    }

    get_ContainedBulk(creature: Creature, item: Item, targetInventory: ItemCollection = null, including: boolean = true) {
        //Sum up all the bulk of an item, including items granted by it and inventories it contains (or they contain).
        //If this item has granted other items, sum up the bulk of each of them.
        //If a targetInventory is given, don't count items in that inventory, as we want to figure out if the whole package will fit into that inventory.
        let bulk = 0;
        if (including) {
            item.gainItems?.forEach(itemGain => {
                let found: number = 0;
                let stackBulk = "";
                let stackSize = 1;
                creature.inventories.filter(inventory => !targetInventory || inventory !== targetInventory).forEach(inventory => {
                    //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                    inventory[itemGain.type].filter((invItem: Item) => itemGain.get_IsMatchingExistingItem(invItem)).forEach((invItem: Item) => {
                        if (invItem.can_Stack()) {
                            found += invItem.amount;
                            stackBulk = (invItem as Equipment).carryingBulk || invItem.bulk;
                            stackSize = (invItem as Consumable).stack || 1;
                        } else {
                            bulk += this.get_RealBulk(invItem, { carrying: true });
                            //If the granted item includes more items, add their bulk as well.
                            bulk += this.get_ContainedBulk(creature, invItem, targetInventory);
                        }
                    })
                })
                if (found && stackBulk && stackSize) {
                    //If one ore more stacked items were found, calculate the stack bulk accordingly.
                    let testItem = new Consumable();
                    testItem.bulk = stackBulk;
                    testItem.amount = Math.min(itemGain.amount, found);
                    testItem.stack = stackSize;
                    bulk += this.get_RealBulk(testItem, { carrying: false });
                }
            })
        }
        //If the item adds an inventory, add the sum bulk of that inventory, unless it's the target inventory. The item will not be moved into the inventory in that case (handled during the move).
        if ((item as Equipment).gainInventory) {
            bulk += creature.inventories.find(inventory => inventory !== targetInventory && inventory.itemId == item.id)?.get_Bulk(false, true) || 0;
        }
        //Remove ugly decimal errors
        bulk = Math.floor(bulk * 10) / 10;
        return bulk;
    }

    get_RealBulk(item: Item, options: { carrying?: boolean, amount?: number }) {
        options = Object.assign({
            carrying: false,
            amount: item.amount
        }, options)
        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
        let itemBulk = 0;
        //Use the item's carrying bulk if carrying is true.
        let bulkString = (options.carrying && (item as Equipment).carryingBulk) ? (item as Equipment).carryingBulk : item.get_Bulk()
        switch (bulkString) {
            case "":
                break;
            case "-":
                break;
            case "L":
                if (options.amount) {
                    itemBulk += Math.floor(options.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                } else {
                    itemBulk += 1;
                }
                break;
            default:
                if (options.amount) {
                    itemBulk += parseInt(bulkString) * 10 * Math.floor(options.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                } else {
                    itemBulk += parseInt(bulkString) * 10;
                }
                break;
        }
        itemBulk = Math.floor(itemBulk) / 10;
        return itemBulk;
    }

    update_GrantingItem(creature: Creature, item: Item) {
        //If this item has granted other items, check how many of those still exist, and update the item's granting list.
        item.gainItems?.forEach(itemGain => {
            let found: number = 0;
            creature.inventories.forEach(inventory => {
                //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                inventory[itemGain.type].filter((invItem: Item) => itemGain.get_IsMatchingExistingItem(invItem)).forEach((invItem: Item) => {
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

    pack_GrantingItem(creature: Creature, item: Item, primaryItem: Item = null) {
        if (!primaryItem) {
            primaryItem = item;
        }
        //Collect all items and inventories granted by an item, including inventories contained in its granted items.
        //Does NOT and should not include the primary item itself.
        let items: Item[] = [];
        let inventories: ItemCollection[] = [];

        item.gainItems?.forEach(itemGain => {
            let toPack: number = itemGain.amount;
            creature.inventories.forEach(inventory => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then add as many of them into the package as the amount demands, and pack their contents as well.
                inventory[itemGain.type].filter((invItem: Item) => itemGain.get_IsMatchingExistingItem(invItem)).forEach((invItem: Item) => {
                    if (toPack) {
                        let moved = Math.min(toPack, invItem.amount);
                        toPack -= moved;
                        let newItem = this.cast_ItemByType(Object.assign<Item, Item>(new Item(), JSON.parse(JSON.stringify(invItem)))).recast(this.typeService, this);
                        newItem.amount = moved;
                        items.push(newItem);
                        let included = this.pack_GrantingItem(creature, invItem, primaryItem);
                        items.push(...included.items);
                        inventories.push(...included.inventories);
                    }
                })
            })
        })

        //If the item adds inventories, add a copy of them to the inventory list.
        if ((item as Equipment).gainInventory?.length) {
            inventories.push(...creature.inventories.filter(inventory => inventory.itemId == item.id).map(inventory => Object.assign<ItemCollection, ItemCollection>(new ItemCollection(), JSON.parse(JSON.stringify(inventory))).recast(this.typeService, this)));
        }

        //At this point, if this is the primary item, all nested items and inventories have been added. We can now clean up the stacks:
        if (item === primaryItem) {
            //If an inventory contains any items that grant more inventories, add those to the list as well, unless they are already in it.
            //In case of nested inventories, repeat until no new iventories are found.
            //We don't pack items granted by items in inventories.
            if (inventories.length) {
                let newInventoriesFound = true;
                while (newInventoriesFound) {
                    newInventoriesFound = false;
                    inventories.forEach(inv => {
                        inv.allEquipment().filter(invItem => invItem.gainInventory.length).forEach(invItem => {
                            let newInventories = creature.inventories.filter(inventory => !inventories.some(inv => inv.id == inventory.id) && inventory.itemId == invItem.id);
                            if (newInventories.length) {
                                newInventoriesFound = true;
                                inventories.push(
                                    ...newInventories.map(inventory => Object.assign<ItemCollection, ItemCollection>(new ItemCollection(), JSON.parse(JSON.stringify(inventory))).recast(this.typeService, this)));
                            }
                        })
                    })
                }
            }

            //If any of the items are already in any of the inventories, remove them from the items list. Also remove the primary item from the items list.
            items.filter(item => inventories.some(inv => inv[item.type].some(invItem => invItem.id == item.id))).forEach(item => {
                item.id = "DELETE";
            })
            items = items.filter(item => item.id != "DELETE" && item.id != primaryItem.id);

            //If the primary item is in one of the inventories, remove it from inventory. It will be moved to the main inventory of the target creature instead.
            inventories.filter(inv => inv[primaryItem.type].some(invItem => invItem.id == primaryItem.id)).forEach(inv => {
                inv[primaryItem.type] = inv[primaryItem.type].filter(invItem => invItem.id != primaryItem.id);
            });
        }

        return { items: items, inventories: inventories };
    }

    get_CannotMove(creature: Creature, item: Item, target: ItemCollection) {
        if (target.itemId == item.id) {
            return "You cannot put a container into itself."
        }
        if (this.get_CannotFit(creature, item, target)) {
            return "The selected inventory does not have enough room for the item."
        }
        if (this.get_IsCircularContainer(creature, item, target)) {
            return "The selected inventory is nested in this container item."
        }
        return "";
    }

    get_CannotFit(creature: Creature, item: Item, target: ItemCollection, options: { amount?: number, including?: boolean } = {}) {
        //All bulk results are multiplied by 10 to avoid decimal addition bugs.
        options = Object.assign({
            amount: 0,
            including: true
        }, options)
        let bulkLimit = target.bulkLimit;
        if (bulkLimit >= 1 && Math.floor(bulkLimit) == bulkLimit) {
            //For full bulk limits (2 rather than 4L, for example), allow 9 light items extra.
            bulkLimit = (bulkLimit * 10) + 9;
        } else {
            bulkLimit *= 10;
        }
        if (target instanceof ItemCollection) {
            if (bulkLimit) {
                let itemBulk = this.get_RealBulk(item, { carrying: true, amount: options.amount }) * 10;
                let containedBulk = this.get_ContainedBulk(creature, item, target, options.including) * 10;
                return ((target.get_Bulk(false) * 10) + itemBulk + containedBulk > bulkLimit)
            }
        }
        return false;
    }

    get_IsCircularContainer(creature: Creature, item: Item, target: ItemCollection) {
        //Check if the target inventory is contained in this item.
        let found = false;
        if (item instanceof Equipment && item.gainInventory?.length) {
            found = this.get_ItemContainsInventory(creature, item, target);
        }
        return found;
    }

    get_ItemContainsInventory(creature: Creature, item: Equipment, inventory: ItemCollection) {
        //If this item grants any inventories, check those inventories for whether they include any items that grant the target inventory.
        //Repeat for any included items that grant inventories themselves, until we are certain that this inventory is not in this container, no matter how deep.
        let found = false;
        if (item.gainInventory?.length) {
            found = creature.inventories.filter(inv => inv.itemId == item.id).some(inv => {
                return inv.allEquipment().some(invItem => invItem.id == inventory.itemId) ||
                    inv.allEquipment().filter(invItem => invItem.gainInventory.length).some(invItem => {
                        return this.get_ItemContainsInventory(creature, invItem, inventory);
                    })
            })
        }
        return found;
    }

    move_GrantedItems(creature: Creature, item: Item, targetInventory: ItemCollection, inventory: ItemCollection, characterService: CharacterService) {
        //If you are moving an item that grants other items, move those as well.
        //Only move items from inventories other than the target inventory, and start from the same inventory that the granting item is in.
        //If any of the contained items contain the the target inventory, that should be caught in move_InventoryItem.
        item.gainItems?.forEach(itemGain => {
            let toMove: number = itemGain.amount;
            [inventory].concat(creature.inventories.filter(inv => inv !== targetInventory && inv !== inventory)).forEach(inv => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then move as many of them into the new inventory as the amount demands.
                inv[itemGain.type].filter((invItem: Item) => itemGain.get_IsMatchingExistingItem(invItem)).forEach(invItem => {
                    if (toMove) {
                        if (!this.get_CannotMove(creature, invItem, targetInventory)) {
                            let moved = Math.min(toMove, invItem.amount);
                            toMove -= moved;
                            this.move_InventoryItemLocally(creature, invItem, targetInventory, inv, characterService, moved);
                        }
                    }
                })
            })
        })
    }

    move_InventoryItemLocally(creature: Creature, item: Item, targetInventory: ItemCollection, inventory: ItemCollection, characterService: CharacterService, amount: number = 0, including: boolean = true) {
        if (targetInventory && targetInventory != inventory && targetInventory.itemId != item.id) {
            item = this.update_GrantingItem(creature, item);
            this.refreshService.set_ToChange("Character", item.id);
            if (!amount) {
                amount = item.amount;
            }
            //Only move the item locally if the item still exists in the inventory.
            if (inventory?.[item.type]?.some(invItem => invItem === item)) {
                //If this item is moved between inventories of the same creature, you don't need to drop it explicitly.
                //Just push it to the new inventory and remove it from the old, but unequip it either way.
                //The item does need to be copied so we don't just move a reference.
                let movedItem = this.cast_ItemByType(JSON.parse(JSON.stringify(item))).recast(this.typeService, this);
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
                if (movedItem instanceof Equipment && movedItem.equipped) {
                    characterService.on_Equip(creature, inventory, movedItem as Equipment, false)
                }
                if (movedItem instanceof Equipment && movedItem.invested) {
                    characterService.on_Invest(creature, inventory, movedItem as Equipment, false)
                }
                //Move all granted items as well.
                if (including) {
                    this.move_GrantedItems(creature, movedItem, targetInventory, inventory, characterService);
                }
                this.refreshService.set_ItemViewChanges(creature, movedItem, { characterService: characterService });
            }
        }
    }

    move_InventoryItemToCreature(creature: Creature, targetCreature: SpellTarget, item: Item, inventory: ItemCollection, characterService: CharacterService, amount: number = 0) {
        if (creature.type != targetCreature.type) {
            item = this.update_GrantingItem(creature, item);
            if (!amount) {
                amount = item.amount;
            }
            let included = this.pack_GrantingItem(creature, item)
            let toCreature = characterService.get_Creature(targetCreature.type);
            let targetInventory = toCreature.inventories[0];
            //Iterate through the main item and all its granted items and inventories.
            [item].concat(included.items).forEach(includedItem => {
                //If any existing, stackable items are found, add this item's amount on top and finish.
                //If no items are found, add the new item and its included items to the inventory.
                let existingItems: Item[] = [];
                if (!includedItem.expiration && includedItem.can_Stack()) {
                    existingItems = targetInventory[includedItem.type].filter((existing: Item) => existing.name == includedItem.name && existing.can_Stack() && !includedItem.expiration);
                }
                if (existingItems.length) {
                    existingItems[0].amount += includedItem.amount;
                    //Update the item's gridicon to reflect its changed amount.
                    this.refreshService.set_Changed(existingItems[0].id);
                } else {
                    let movedItem = this.cast_ItemByType(JSON.parse(JSON.stringify(includedItem))).recast(this.typeService, this);
                    let newLength = targetInventory[includedItem.type].push(movedItem);
                    let newItem = targetInventory[includedItem.type][newLength - 1];
                    newItem = characterService.process_GrantedItem(toCreature, newItem, targetInventory, true, false, true, true);
                }
            })
            //Add included inventories and process all items inside them.
            included.inventories.forEach(inventory => {
                let newLength = toCreature.inventories.push(inventory);
                let newInventory = toCreature.inventories[newLength - 1];
                newInventory.allItems().forEach(invItem => {
                    invItem = characterService.process_GrantedItem(toCreature, invItem, newInventory, true, false, true, true);
                })
            })
            //If the item still exists on the inventory, drop it with all its contents.
            if (inventory?.[item.type]?.some(invItem => invItem === item)) {
                characterService.drop_InventoryItem(creature, inventory, item, false, true, true, amount);
            }
            this.refreshService.set_ToChange(toCreature.type, "inventory");
            this.refreshService.set_ToChange(creature.type, "inventory");
            this.refreshService.set_ToChange(toCreature.type, "effects");
            this.refreshService.set_ToChange(creature.type, "effects");
        }
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
            item.gainConditions.forEach(gain => {
                let newConditionGain = Object.assign(new ConditionGain(), gain).recast();
                characterService.add_Condition(creature, newConditionGain, {}, { noReload: true });
            });

            //Cast Spells
            if (item instanceof Oil) {
                item.castSpells.forEach((cast: SpellCast) => {
                    cast.spellGain.duration = cast.duration;
                    let librarySpell = spellsService.get_Spells(cast.name)[0];
                    if (librarySpell) {
                        spellsService.process_Spell(creature, creature.type, characterService, itemsService, conditionsService, null, null, cast.spellGain, librarySpell, cast.level, true, true, false);
                    }
                })
            }

            //Gain Items on Activation
            if (item.gainItems.length) {
                item.gainItems.forEach(gainItem => {
                    gainItem.grant_GrantedItem(creature, { sourceName: item.get_Name(), grantingItem: item }, { characterService: characterService, itemsService: this })
                });
            }

        }

    }

    rest(creature: Creature, characterService: CharacterService) {
        creature.inventories.forEach(inv => {
            inv.allItems().filter(item => item.expiration == -2).forEach(item => {
                item.name = "DELETE";
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().some(item => item.name == "DELETE")) {
                inv.allItems().filter(item => item.name == "DELETE").forEach(item => {
                    characterService.drop_InventoryItem(creature, inv, item, false, true, true, item.amount);
                })
                this.refreshService.set_ToChange(creature.type, "inventory");
            }
            //Grant items that are granted by other items on rest.
            inv.allItems().filter(item => item.gainItems.length && item.investedOrEquipped()).forEach(item => {
                item.gainItems.filter(gain => gain.on == "rest").forEach(gainItem => {
                    gainItem.grant_GrantedItem(creature, { sourceName: item.get_Name(), grantingItem: item }, { characterService: characterService, itemsService: this })
                });
            })
        })
        if (creature instanceof Character) {
            //If you have Scroll Savant, get a copy of each prepared scroll that lasts until the next rest.
            if (characterService.get_CharacterFeatsTaken(1, creature.level, "Scroll Savant").length) {
                creature.class.spellCasting.filter(casting => casting.scrollSavant.length).forEach(casting => {
                    casting.scrollSavant.forEach(scroll => {
                        characterService.grant_InventoryItem(creature, creature.inventories[0], scroll, false, false, false);
                    });
                });
            }

            //If you have Battleforger, all your battleforged items are reset.
            if (characterService.get_CharacterFeatsTaken(1, creature.level, "Battleforger").length) {
                let attacksChanged: boolean = false;
                let defenseChanged: boolean = false;
                creature.inventories.forEach(inv => {
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
                    this.refreshService.set_ToChange("Character", "attacks");
                }
                if (defenseChanged) {
                    this.refreshService.set_ToChange("Character", "defense");
                }
            }

            //For feats that grant you an item on rest, grant these here and set an expiration until the next rest.
            characterService.featsService.get_CharacterFeats(creature.customFeats)
                .filter(feat => feat.gainItems.some(gain => gain.on == "rest") && feat.have(creature, characterService, creature.level))
                .forEach(feat => {
                    feat.gainItems.filter(gain => gain.on == "rest").forEach(gainItem => {
                        gainItem.grant_GrantedItem(creature, { sourceName: feat.name }, { characterService: characterService, itemsService: this })
                    });
                });
        }
    }

    refocus(creature: Creature, characterService: CharacterService) {
        creature.inventories.forEach(inv => {
            inv.allItems().filter(item => item.expiration == -3).forEach(item => {
                item.name = "DELETE";
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().some(item => item.name == "DELETE")) {
                inv.allItems().filter(item => item.name == "DELETE").forEach(item => {
                    characterService.drop_InventoryItem(creature, inv, item, false, true, true, item.amount);
                })
                this.refreshService.set_ToChange(creature.type, "inventory");
            }
        })
    }

    tick_Items(creature: Creature, characterService: CharacterService, turns: number) {
        creature.inventories.forEach(inv => {
            //Tick down and remove all items that expire.
            function expirationApplies(item: Item): boolean {
                switch (item.expiresOnlyIf) {
                    case "equipped": return item.investedOrEquipped();
                    case "unequipped": return !item.investedOrEquipped();
                    default: return true;
                }
            }
            inv.allItems().filter(item => item.expiration > 0 && expirationApplies(item)).forEach(item => {
                item.expiration -= turns;
                if (item.expiration <= 0) {
                    item.name = "DELETE";
                    if (item instanceof Equipment && item.gainInventory.length) {
                        //If a temporary container is destroyed, return all contained items to the main inventory.
                        creature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                            inv.allItems().forEach(invItem => {
                                this.move_InventoryItemLocally(creature, invItem, creature.inventories[0], inv, characterService);
                            });
                        });
                    }
                }
                this.refreshService.set_ToChange(creature.type, "inventory");
                if (item instanceof Shield && item.equipped) {
                    this.refreshService.set_ToChange(creature.type, "attacks");
                }
                if ((item instanceof Armor || item instanceof Shield) && item.equipped) {
                    this.refreshService.set_ToChange(creature.type, "defense");
                }
            })
            inv.wands.filter(wand => wand.cooldown > 0).forEach(wand => {
                wand.cooldown = Math.max(wand.cooldown - turns, 0);
                this.refreshService.set_ToChange(creature.type, "inventory");
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().some(item => item.name == "DELETE")) {
                inv.allItems().filter(item => item.name == "DELETE").forEach(item => {
                    characterService.drop_InventoryItem(creature, inv, item, false, true, true, item.amount);
                })
                this.refreshService.set_ToChange(creature.type, "inventory");
            }
            inv.allItems().filter(item => item.oilsApplied && item.oilsApplied.length).forEach(item => {
                item.oilsApplied.filter(oil => oil.duration != -1).forEach(oil => {
                    oil.duration -= turns;
                    if (oil.duration <= 0) {
                        oil.name = "DELETE";
                    }
                    this.refreshService.set_ToChange(creature.type, "inventory");
                    if (item instanceof Weapon && item.equipped) {
                        this.refreshService.set_ToChange(creature.type, "attacks");
                    }
                    if ((item instanceof Armor || item instanceof Shield) && item.equipped) {
                        this.refreshService.set_ToChange(creature.type, "defense");
                    }
                })
                item.oilsApplied = item.oilsApplied.filter(oil => oil.name != "DELETE");
            });
        });
    }

    still_loading() {
        return this.loading;
    }

    initialize() {
        //Initialize items once, but cleanup specialization effects and reset store and crafting items everytime thereafter.
        if (!this.items) {
            this.loading = true;
            this.load(json_itemproperties, "itemProperties", ItemProperty, "meta");
            this.itemProperties = this.extensionsService.cleanup_DuplicatesWithMultipleIdentifiers(this.itemProperties, ["group", "parent", "key"], "custom item properties");
            this.load(json_armormaterials, "armorMaterials", ArmorMaterial, "meta");
            this.armorMaterials = this.extensionsService.cleanup_Duplicates(this.armorMaterials, "name", "armor materials");
            this.load(json_shieldmaterials, "shieldMaterials", ShieldMaterial, "meta");
            this.shieldMaterials = this.extensionsService.cleanup_DuplicatesWithMultipleIdentifiers(this.shieldMaterials, ["name", "itemFilter"], "shield materials");
            this.load(json_weaponmaterials, "weaponMaterials", WeaponMaterial, "meta");
            this.weaponMaterials = this.extensionsService.cleanup_Duplicates(this.weaponMaterials, "name", "weapon materials");
            this.load(json_specializations, "specializations", Specialization, "meta");
            this.specializations = this.extensionsService.cleanup_Duplicates(this.specializations, "name", "armor and weapon specializations");

            this.items = new ItemCollection();
            this.cleanItems = new ItemCollection();
            this.craftingItems = new ItemCollection();

            //Runes need to load before other items, because their content is copied into items that bear them.
            this.load(json_armorrunes, "armorrunes", ArmorRune, "item", "armor runes");
            this.load(json_weaponrunes, "weaponrunes", WeaponRune, "item", "weapon runes");
            //Oils need to load after WeaponRunes, because they have to copy some of them.
            this.load(json_oils, "oils", Oil, "item", "oils");

            this.load(json_adventuringgear, "adventuringgear", AdventuringGear, "item", "adventuring gear");
            this.load(json_alchemicalbombs, "alchemicalbombs", AlchemicalBomb, "item", "alchemical bombs");
            this.load(json_alchemicalelixirs, "alchemicalelixirs", AlchemicalElixir, "item", "alchemical elixirs");
            this.load(json_alchemicalpoisons, "alchemicalpoisons", AlchemicalPoison, "item", "alchemical poisons");
            this.load(json_alchemicaltools, "alchemicaltools", AlchemicalTool, "item", "alchemical tools");
            this.load(json_ammunition, "ammunition", Ammunition, "item", "ammunition");
            this.load(json_armors, "armors", Armor, "item", "armors");
            this.load(json_helditems, "helditems", HeldItem, "item", "held items");
            this.load(json_materialitems, "materialitems", MaterialItem, "item", "materials");
            this.load(json_otherconsumables, "otherconsumables", OtherConsumable, "item", "other consumables");
            this.load(json_otherconsumablesbombs, "otherconsumablesbombs", OtherConsumableBomb, "item", "other consumables (bombs)");
            this.load(json_potions, "potions", Potion, "item", "potions");
            this.load(json_scrolls, "scrolls", Scroll, "item", "scrolls");
            this.load(json_shields, "shields", Shield, "item", "shields");
            this.load(json_snares, "snares", Snare, "item", "snares");
            this.load(json_talismans, "talismans", Talisman, "item", "talismans");
            this.load(json_wands, "wands", Wand, "item", "wands");
            this.load(json_weapons, "weapons", Weapon, "item", "weapons");
            this.load(json_wornitems, "wornitems", WornItem, "item", "worn items");

            /*
            this.load(json_REPLACE0, "REPLACE0", REPLACE1, "item");
            */

            //Make a copy of clean items for shop items and crafting items.
            this.items = Object.assign<ItemCollection, ItemCollection>(new ItemCollection(), JSON.parse(JSON.stringify(this.cleanItems))).recast(this.typeService, this);
            this.craftingItems = Object.assign<ItemCollection, ItemCollection>(new ItemCollection(), JSON.parse(JSON.stringify(this.cleanItems))).recast(this.typeService, this);

            this.loading = false;

        } else {
            //Reset items and crafting items from clean items.
            this.items = Object.assign<ItemCollection, ItemCollection>(new ItemCollection(), JSON.parse(JSON.stringify(this.cleanItems))).recast(this.typeService, this);
            this.craftingItems = Object.assign<ItemCollection, ItemCollection>(new ItemCollection(), JSON.parse(JSON.stringify(this.cleanItems))).recast(this.typeService, this);
            //Disable any active hint effects when loading a character, and reinitialize the hints.
            this.specializations.forEach(spec => {
                spec = spec.recast();
                spec.hints?.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                })
            })
        }
    }

    load(source, target: string, type, category: "item" | "meta", listName: string = "") {
        let data;
        switch (category) {
            case "item":
                this.cleanItems[target] = [];
                this.items[target] = [];
                this.craftingItems[target] = [];
                data = this.extensionsService.extend(source, "items_" + target);
                //Initialize all clean items. Recasting happens in the initialization, and the store and crafting items will be copied and recast afterwards.
                Object.keys(data).forEach(key => {
                    this.cleanItems[target].push(...data[key].map((obj: Item) => this.initialize_Item(Object.assign(new type(), obj), true, false, true)));
                });
                this.cleanItems[target] = this.extensionsService.cleanup_Duplicates(this.cleanItems[target], "id", listName);
                break;
            case "meta":
                this[target] = [];
                data = this.extensionsService.extend(source, target);
                Object.keys(data).forEach(key => {
                    this[target].push(...data[key].map(obj => Object.assign(new type(), obj).recast()));
                });
                break;
        }
    }

}