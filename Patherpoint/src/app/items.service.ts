import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Weapon } from './Weapon';
import { Armor } from './Armor';
import { Shield } from './Shield';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
import { Oil } from './Oil';
import { Talisman } from './Talisman';
import { Familiar } from './Familiar';
import { SpellsService } from './spells.service';
import { TimeService } from './time.service';
import { SpellCast } from './SpellCast';
import { AlchemicalBomb } from './AlchemicalBomb';
import { AlchemicalTool } from './AlchemicalTool';
import { Snare } from './Snare';
import { WeaponMaterial } from './WeaponMaterial';
import { AlchemicalPoison } from './AlchemicalPoison';
import { OtherConsumableBomb } from './OtherConsumableBOmb';
import { Wand } from './Wand';
import { Loader } from './Loader';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    private items: ItemCollection;
    private cleanItems: ItemCollection;
    private craftingItems: ItemCollection;
    private itemProperties: ItemProperty[];
    private weaponMaterials: WeaponMaterial[];
    private specializations: Specialization[];

    private loader_ItemProperties: Loader = new Loader();
    private loader_WeaponMaterials: Loader = new Loader();
    private loader_Specializations: Loader = new Loader();
    private loader_Weapons: Loader = new Loader();
    private loader_Armors: Loader = new Loader();
    private loader_Shields: Loader = new Loader();
    private loader_WornItems: Loader = new Loader();
    private loader_HeldItems: Loader = new Loader();
    private loader_AlchemicalElixirs: Loader = new Loader();
    private loader_Ammunition: Loader = new Loader();
    private loader_Potions: Loader = new Loader();
    private loader_OtherConsumables: Loader = new Loader();
    private loader_OtherConsumablesBombs : Loader = new Loader();
    private loader_AdventuringGear: Loader = new Loader();
    private loader_ArmorRunes: Loader = new Loader();
    private loader_WeaponRunes: Loader = new Loader();
    private loader_Scrolls: Loader = new Loader();
    private loader_Oils: Loader = new Loader();
    private loader_Talismans: Loader = new Loader();
    private loader_AlchemicalBombs: Loader = new Loader();
    private loader_AlchemicalTools: Loader = new Loader();
    private loader_Snares: Loader = new Loader();
    private loader_AlchemicalPoisons: Loader = new Loader();
    private loader_Wands: Loader = new Loader();

    private loader_CustomWeapons: Loader = new Loader();
    private loader_CustomArmors: Loader = new Loader();
    private loader_CustomShields: Loader = new Loader();
    private loader_CustomWornItems: Loader = new Loader();
    private loader_CustomHeldItems: Loader = new Loader();
    private loader_CustomAlchemicalElixirs: Loader = new Loader();
    private loader_CustomAmmunition: Loader = new Loader();
    private loader_CustomPotions: Loader = new Loader();
    private loader_CustomOtherConsumables: Loader = new Loader();
    private loader_CustomOtherConsumablesBombs : Loader = new Loader();
    private loader_CustomAdventuringGear: Loader = new Loader();
    private loader_CustomArmorRunes: Loader = new Loader();
    private loader_CustomWeaponRunes: Loader = new Loader();
    private loader_CustomScrolls: Loader = new Loader();
    private loader_CustomOils: Loader = new Loader();
    private loader_CustomTalismans: Loader = new Loader();
    private loader_CustomAlchemicalBombs: Loader = new Loader();
    private loader_CustomAlchemicalTools: Loader = new Loader();
    private loader_CustomSnares: Loader = new Loader();
    private loader_CustomAlchemicalPoisons: Loader = new Loader();
    private loader_CustomWands: Loader = new Loader();
    /*
    private loader_REPLACE1s: Loader = new Loader();
    private loader_CustomREPLACE1s: Loader = new Loader();
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
            return this.items[type].filter(item => item.name.toLowerCase() == name.toLowerCase() || name == "");
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
            newItem.id = uuidv1();
        }
        newItem = this.savegameService.reassign(newItem);
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
                this.savegameService.reassign(newItem.runeEffect);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += " (" + newItem.name + ")" });
            }
        }
        //For base items that come with property Runes with name only, load the rune into the item here.
        if (resetPropertyRunes && (newItem.type == "weapons" || newItem.moddable == "weapon") && newItem.propertyRunes?.length) {
            let newRunes: WeaponRune[] = [];
            newItem.propertyRunes.forEach((rune: WeaponRune) => {
                let libraryItem = this.cleanItems.weaponrunes.find(newrune => newrune.name == rune.name)
                if (libraryItem) {
                    newRunes.push(this.savegameService.merge(libraryItem, rune))
                }
            })
            newItem.propertyRunes = newRunes;
        }
        if (resetPropertyRunes && (newItem.type == "armors" || newItem.moddable == "armor") && newItem.propertyRunes?.length) {
            let newRunes: ArmorRune[] = [];
            newItem.propertyRunes.forEach((rune: ArmorRune) => {
                let libraryItem = this.cleanItems.armorrunes.find(newrune => newrune.name == rune.name)
                if (libraryItem) {
                    newRunes.push(this.savegameService.merge(libraryItem, rune))
                }
            })
            newItem.propertyRunes = newRunes;
        }

        return newItem;
    }

    restore_ItemFromSave(item: any) {
        if (item.refId) {
            let libraryItem = this.get_CleanItemByID(item.refId);
            if (libraryItem) {
                //Map the restored object onto the library object and keep the result.
                try {
                    item = this.savegameService.merge(libraryItem, item);
                    item = this.cast_ItemByClassName(item, libraryItem.constructor.name);
                } catch (e) {
                    console.log("Failed reassigning: " + e)
                }
            }
        }
        item = this.initialize_Item(item, true, false, false);
        return item;
    }

    clean_ItemForSave(item: any) {
        if (item.refId) {
            let libraryItem = this.get_CleanItemByID(item.refId);
            if (libraryItem) {
                Object.keys(item).forEach(key => {
                    if (!item.save.includes(key)) {
                        //If the item has a refId, a library item can be found with that id, and the property is not on the save list, compare the property with the library item
                        //If they have the same value, delete the property from the item - it can be recovered during loading from the refId.
                        //The save list is there to preserve values that might be different from the reference item, but the same as the default item,
                        //  and would therefore not overwrite the reference item.
                        if (JSON.stringify(item[key]) == JSON.stringify(libraryItem[key])) {
                            delete item[key];
                        }
                    }
                })
            }
        }
        return item;
    }

    move_InventoryItem(creature: Character|AnimalCompanion, item: Item, targetInventory: ItemCollection, inventory: ItemCollection, characterService: CharacterService) {
        if (targetInventory && targetInventory != inventory) {
            let fromCreature = characterService.get_Creatures().find(creature => creature.inventories.find(inv => inv === inventory)) as Character | AnimalCompanion;
            let toCreature = characterService.get_Creatures().find(creature => creature.inventories.find(inv => inv === targetInventory)) as Character | AnimalCompanion;
            if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length && fromCreature == toCreature) {
                //If this item is a container and is moved between inventories of the same creature, you don't need to drop it explicitly.
                //Just push it to the new inventory and remove it from the old, but unequip it either way.
                let movedItem = JSON.parse(JSON.stringify(item));
                movedItem = characterService.reassign(movedItem);
                targetInventory[item.type].push(movedItem);
                inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item)
                if ((movedItem as Equipment).equipped) {
                    characterService.onEquip(creature, inventory, movedItem as Equipment, false)
                }
                if ((movedItem as Equipment).invested) {
                    characterService.onInvest(creature, inventory, movedItem as Equipment, false)
                }
            } else {
                let movedItem = JSON.parse(JSON.stringify(item));
                let movedInventories: ItemCollection[]
                //If this item is a container and is moved between creatures, the attached inventories need to be moved as well.
                //Because we lose the inventory when we drop the item, but automatically gain one when we grant the item to the other creature,
                // we need to first save the inventory, then recreate it and remove the new ones after moving the item.
                //Here, we save the inventories and take care of any containers within the container.
                if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                    //First, move all inventory items within this inventory item to the same target. They get 
                    fromCreature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                        inv.allItems().filter(invItem => (invItem as Equipment).gainInventory && (invItem as Equipment).gainInventory.length).forEach(invItem => {
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
                    characterService.onInvest(creature, targetInventory, newItem as Equipment, false)
                }
            }

        }

    }

    process_Consumable(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, itemsService: ItemsService, timeService: TimeService, spellsService: SpellsService, item: Consumable) {

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
                cast.spellGain.duration = cast.zduration;
                let librarySpell = spellsService.get_Spells(cast.name)[0];
                spellsService.process_Spell(creature, creature.type, characterService, itemsService, timeService, null, cast.spellGain, librarySpell, cast.level, true, true, false);
            })
        }

        //Gain Items on Activation
        if (item.gainItems.length && creature.type != "Familiar") {
            item.gainItems.forEach(gainItem => {
                let newItem: Item = itemsService.get_CleanItems()[gainItem.type].filter(libraryItem => libraryItem.name == gainItem.name)[0];
                if (newItem) {
                    let grantedItem = characterService.grant_InventoryItem(creature as Character|AnimalCompanion, creature.inventories[0], newItem, false, false, true);
                    gainItem.id = grantedItem.id;
                    grantedItem.expiration = gainItem.expiration;
                    if (grantedItem.get_Name) {
                        grantedItem.grantedBy = "(Granted by " + item.name + ")";
                    };
                } else {
                    console.log("Failed granting " + gainItem.type + " " + gainItem.name + " - item not found.")
                }
            });
        }

    }

    rest(creature: Character | AnimalCompanion, characterService: CharacterService) {
        creature.inventories.forEach(inv => {
            inv.allItems().filter(item => item.expiration == -2).forEach(item => {
                item.name = "DELETE";
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().filter(item => item.name == "DELETE").length) {
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

            //For feats that grant you an item on rest, grant these here and set an expiration until the next rest.
            characterService.featsService.get_All(creature.customFeats)
                .filter(feat => feat.gainItems.find(gain => gain.on == "rest") && feat.have(creature, characterService, creature.level))
                .forEach(feat => {
                    feat.gainItems.filter(gain => gain.on == "rest").forEach(gainItem => {
                        let newItem: Item = this.get_CleanItemsOfType(gainItem.type, gainItem.name)[0];
                        let grantedItem: Item;
                        if (newItem && newItem.can_Stack() && (gainItem.amount ? gainItem.amount : 0) + (gainItem.amountPerLevel ? gainItem.amountPerLevel : 0 * creature.level)) {
                            grantedItem = characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, true, false, false, (gainItem.amount ? gainItem.amount : 0) + (gainItem.amountPerLevel ? gainItem.amountPerLevel : 0 * creature.level), undefined, -2);
                        } else if (newItem) {
                            grantedItem = characterService.grant_InventoryItem(creature, creature.inventories[0], newItem, true, false, true, 1, undefined, -2);
                        }
                    });
                });
        }
    }

    tick_Items(creature: Character | AnimalCompanion, characterService: CharacterService, turns: number) {
        creature.inventories.forEach(inv => {
            //Tick down and remove all items that expire.
            inv.allItems().filter(item => item.expiration > 0).forEach(item => {
                item.expiration -= turns;
                if (item.expiration <= 0) {
                    item.name = "DELETE";
                    if ((item as Equipment).gainInventory && (item as Equipment).gainInventory.length) {
                        //If a temporary container is destroyed, return all contained items to the main inventory.
                        creature.inventories.filter(inv => inv.itemId == item.id).forEach(inv => {
                            inv.allItems().forEach(invItem => {
                                this.move_InventoryItem(creature, invItem, creature.inventories[0], inv, characterService);
                            });
                        });
                    }
                }
                characterService.set_ToChange(creature.type, "inventory");
                if (item.type == "weapons" && (item as Equipment).equipped) {
                    characterService.set_ToChange(creature.type, "attacks");
                }
                if (["armors", "shields"].includes(item.type) && (item as Equipment).equipped) {
                    characterService.set_ToChange(creature.type, "defense");
                }
            })
            inv.wands.filter(wand => wand.cooldown > 0).forEach(wand => {
                wand.cooldown = Math.max(wand.cooldown - turns, 0);
                characterService.set_ToChange(creature.type, "inventory");
            })
            //Removing an item brings the index out of order, and some items may be skipped. We just keep deleting items named DELETE until none are left.
            while (inv.allItems().filter(item => item.name == "DELETE").length) {
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
                    if (item.type == "weapons" && (item as Equipment).equipped) {
                        characterService.set_ToChange(creature.type, "attacks");
                    }
                    if (["armors", "shields"].includes(item.type) && (item as Equipment).equipped) {
                        characterService.set_ToChange(creature.type, "defense");
                    }
                })
                item.oilsApplied = item.oilsApplied.filter(oil => oil.name != "DELETE");
            });
        });
    }

    still_loading() {
        return (
            this.loader_ItemProperties.loading ||
            this.loader_WeaponMaterials.loading ||
            this.loader_Specializations.loading ||
            this.loader_Weapons.loading ||
            this.loader_Armors.loading ||
            this.loader_Shields.loading ||
            this.loader_WornItems.loading ||
            this.loader_HeldItems.loading ||
            this.loader_AlchemicalElixirs.loading ||
            this.loader_Ammunition.loading ||
            this.loader_Potions.loading ||
            this.loader_OtherConsumables.loading ||
            this.loader_OtherConsumablesBombs .loading ||
            this.loader_AdventuringGear.loading ||
            this.loader_ArmorRunes.loading ||
            this.loader_WeaponRunes.loading ||
            this.loader_Scrolls.loading ||
            this.loader_Oils.loading ||
            this.loader_Talismans.loading ||
            this.loader_AlchemicalBombs.loading ||
            this.loader_AlchemicalTools.loading ||
            this.loader_Snares.loading ||
            this.loader_AlchemicalPoisons.loading ||
            this.loader_Wands.loading
        );
    }

    initialize(reset: boolean = true) {
        if (!this.items || reset) {
            this.load('/assets/itemProperties.json', this.loader_ItemProperties, "itemProperties", ItemProperty, "meta");
            this.load('/assets/weaponMaterials.json', this.loader_WeaponMaterials, "weaponMaterials", WeaponMaterial, "meta");
            this.load('/assets/specializations.json', this.loader_Specializations, "specializations", Specialization, "meta");

            this.items = new ItemCollection();
            this.cleanItems = new ItemCollection();
            this.craftingItems = new ItemCollection();
            
            this.load('/assets/items/weapons.json', this.loader_Weapons, "weapons", Weapon, "item");
            this.load('/assets/items/armors.json', this.loader_Armors, "armors", Armor, "item");
            this.load('/assets/items/shields.json', this.loader_Shields, "shields", Shield, "item");
            this.load('/assets/items/wornitems.json', this.loader_WornItems, "wornitems", WornItem, "item");
            this.load('/assets/items/helditems.json', this.loader_HeldItems, "helditems", HeldItem, "item");
            this.load('/assets/items/ammunition.json', this.loader_Ammunition, "ammunition", Ammunition, "item");
            this.load('/assets/items/alchemicalelixirs.json', this.loader_AlchemicalElixirs, "alchemicalelixirs", AlchemicalElixir, "item");
            this.load('/assets/items/potions.json', this.loader_Potions, "potions", Potion, "item");
            this.load('/assets/items/otherconsumables.json', this.loader_OtherConsumables, "otherconsumables", OtherConsumable, "item");
            this.load('/assets/items/otherconsumablesbombs.json', this.loader_OtherConsumablesBombs, "otherconsumablesbombs", OtherConsumableBomb, "item");
            this.load('/assets/items/adventuringgear.json', this.loader_AdventuringGear, "adventuringgear", AdventuringGear, "item");
            this.load('/assets/items/armorrunes.json', this.loader_ArmorRunes, "armorrunes", ArmorRune, "item");
            this.load('/assets/items/weaponrunes.json', this.loader_WeaponRunes, "weaponrunes", WeaponRune, "item");
            this.load('/assets/items/scrolls.json', this.loader_Scrolls, "scrolls", Scroll, "item");
            this.load('/assets/items/talismans.json', this.loader_Talismans, "talismans", Talisman, "item");
            this.load('/assets/items/alchemicalbombs.json', this.loader_AlchemicalBombs, "alchemicalbombs", AlchemicalBomb, "item");
            this.load('/assets/items/alchemicaltools.json', this.loader_AlchemicalTools, "alchemicaltools", AlchemicalTool, "item");
            this.load('/assets/items/snares.json', this.loader_Snares, "snares", Snare, "item");
            this.load('/assets/items/alchemicalpoisons.json', this.loader_AlchemicalPoisons, "alchemicalpoisons", AlchemicalPoison, "item");
            this.load('/assets/items/wands.json', this.loader_Wands, "wands", Wand, "item");

            this.load('/assets/custom/items/weapons.json', this.loader_CustomWeapons, "weapons", Weapon, "item");
            this.load('/assets/custom/items/armors.json', this.loader_CustomArmors, "armors", Armor, "item");
            this.load('/assets/custom/items/shields.json', this.loader_CustomShields, "shields", Shield, "item");
            this.load('/assets/custom/items/wornitems.json', this.loader_CustomWornItems, "wornitems", WornItem, "item");
            this.load('/assets/custom/items/helditems.json', this.loader_CustomHeldItems, "helditems", HeldItem, "item");
            this.load('/assets/custom/items/ammunition.json', this.loader_CustomAmmunition, "ammunition", Ammunition, "item");
            this.load('/assets/custom/items/alchemicalelixirs.json', this.loader_CustomAlchemicalElixirs, "alchemicalelixirs", AlchemicalElixir, "item");
            this.load('/assets/custom/items/potions.json', this.loader_CustomPotions, "potions", Potion, "item");
            this.load('/assets/custom/items/otherconsumables.json', this.loader_CustomOtherConsumables, "otherconsumables", OtherConsumable, "item");
            this.load('/assets/custom/items/otherconsumablesbombs.json', this.loader_CustomOtherConsumablesBombs, "otherconsumablesbombs", OtherConsumableBomb, "item");
            this.load('/assets/custom/items/adventuringgear.json', this.loader_CustomAdventuringGear, "adventuringgear", AdventuringGear, "item");
            this.load('/assets/custom/items/armorrunes.json', this.loader_CustomArmorRunes, "armorrunes", ArmorRune, "item");
            this.load('/assets/custom/items/weaponrunes.json', this.loader_CustomWeaponRunes, "weaponrunes", WeaponRune, "item");
            this.load('/assets/custom/items/scrolls.json', this.loader_CustomScrolls, "scrolls", Scroll, "item");
            this.load('/assets/custom/items/talismans.json', this.loader_CustomTalismans, "talismans", Talisman, "item");
            this.load('/assets/custom/items/alchemicalbombs.json', this.loader_CustomAlchemicalBombs, "alchemicalbombs", AlchemicalBomb, "item");
            this.load('/assets/custom/items/alchemicaltools.json', this.loader_CustomAlchemicalTools, "alchemicaltools", AlchemicalTool, "item");
            this.load('/assets/custom/items/snares.json', this.loader_CustomSnares, "snares", Snare, "item");
            this.load('/assets/custom/items/alchemicalpoisons.json', this.loader_CustomAlchemicalPoisons, "alchemicalpoisons", AlchemicalPoison, "item");
            this.load('/assets/custom/items/wands.json', this.loader_CustomWands, "wands", Wand, "item");
            /*
            this.load('/assets/items/REPLACE0.json', this.loader_REPLACE1s, "REPLACE0", REPLACE1, "item");
            this.load('/assets/custom/items/REPLACE0.json', this.loader_CustomREPLACE1s, "REPLACE0", REPLACE1, "item");
            */
            this.load_Oils();
        }
    }

    load_Oils() {
        //Oils have to wait until WeaponRunes are finished, because they have to copy some of them.
        if (this.loader_WeaponRunes.content.length || !this.cleanItems.weaponrunes.length) {
            setTimeout(() => {
                this.load_Oils();
            }, 100);
        } else {
            this.load('/assets/items/oils.json', this.loader_Oils, "oils", Oil, "item");
            this.load('/assets/custom/items/oils.json', this.loader_CustomOils, "oils", Oil, "item");
        }
    }

    load(filepath: string, loader: Loader, target: string, type, category: "item"|"meta") {
        loader.loading = true;
        this.load_File(filepath)
            .subscribe((results:string[]) => {
                loader.content = results;
                this.finish_Loading(loader, target, type, category)
            });
    }

    load_File(filepath): Observable<string[]>{
        return this.http.get<string[]>(filepath)
        .pipe(map(result => result), catchError(() => of([])));
    }

    finish_Loading(loader: Loader, target: string, type, category: "item"|"meta") {
        switch(category) {
            case "item":
                if (loader.content.length) {
                    this.items[target].push(...loader.content.map(element => this.initialize_Item(Object.assign(new type(), element), true, false, true)));
                    this.cleanItems[target].push(...loader.content.map(element => this.initialize_Item(Object.assign(new type(), element), true, false, true)));
                    this.craftingItems[target].push(...loader.content.map(element => this.initialize_Item(Object.assign(new type(), element), true, false, true)));
                }
                break;
            case "meta":
                if (loader.content.length) {
                    this[target] = loader.content.map(element => Object.assign(new type(), element));
                } else {
                    this[target] = [];
                }
                break;
        }
        loader.content = [];
        if (loader.loading) {loader.loading = false;}
    }

}