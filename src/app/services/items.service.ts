/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SpellsService } from 'src/app/services/spells.service';
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
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { CutOffDecimals } from 'src/libs/shared/util/numberUtils';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';

type AnyItemType =
    ArmorRune | WeaponRune | Oil | AdventuringGear | AlchemicalBomb | AlchemicalElixir | AlchemicalPoison
    | AlchemicalTool | Ammunition | Armor | HeldItem | MaterialItem | OtherConsumable
    | OtherConsumableBomb | Potion | Scroll | Shield | Snare | Talisman | Wand | Weapon | WornItem;

@Injectable({
    providedIn: 'root',
})
export class ItemsService {

    private readonly _cleanItems: ItemCollection = new ItemCollection();
    private _storeItems: ItemCollection = new ItemCollection();
    private _craftingItems: ItemCollection = new ItemCollection();
    private _itemProperties: Array<ItemProperty> = [];
    private _armorMaterials: Array<ArmorMaterial> = [];
    private _shieldMaterials: Array<ShieldMaterial> = [];
    private _weaponMaterials: Array<WeaponMaterial> = [];
    private _specializations: Array<Specialization> = [];
    private _initialized = false;

    constructor(
        private readonly _typeService: TypeService,
        private readonly _extensionsService: ExtensionsService,
        private readonly _activitiesService: ActivitiesDataService,
        private readonly _refreshService: RefreshService,
    ) { }

    public storeItems(): ItemCollection {
        if (!this.stillLoading) {
            return this._storeItems;
        } else { return new ItemCollection(); }
    }

    public cleanItems(): ItemCollection {
        if (!this.stillLoading) {
            return this._cleanItems;
        } else { return new ItemCollection(); }
    }

    public craftingItems(): ItemCollection {
        if (!this.stillLoading) {
            return this._craftingItems;
        } else { return new ItemCollection(); }
    }

    public storeItemByID(id: string): Item {
        if (!this.stillLoading) {
            return this._storeItems.allItems().find(item => item.id === id);
        } else { return null; }
    }

    public cleanItemByID(id: string): Item {
        if (!this.stillLoading) {
            return this._cleanItems.allItems().find(item => item.id === id);
        } else { return null; }
    }

    public craftingItemByID(id: string): Item {
        if (!this.stillLoading) {
            return this._craftingItems.allItems().find(item => item.id === id);
        } else { return null; }
    }

    public itemProperties(): Array<ItemProperty> {
        if (!this.stillLoading) {
            return this._itemProperties;
        } else { return [new ItemProperty()]; }
    }

    public armorMaterials(): Array<ArmorMaterial> {
        if (!this.stillLoading) {
            return this._armorMaterials;
        } else { return [new ArmorMaterial()]; }
    }

    public shieldMaterials(): Array<ShieldMaterial> {
        if (!this.stillLoading) {
            return this._shieldMaterials;
        } else { return [new ShieldMaterial()]; }
    }

    public weaponMaterials(): Array<WeaponMaterial> {
        if (!this.stillLoading) {
            return this._weaponMaterials;
        } else { return [new WeaponMaterial()]; }
    }

    public specializations(group = ''): Array<Specialization> {
        if (!this.stillLoading) {
            return this._specializations.filter(spec =>
                !group || spec.name.toLowerCase() === group.toLowerCase(),
            );
        } else { return [new Specialization()]; }
    }

    public cleanItemsOfType<T extends AnyItemType>(type: string, name = ''): Array<T> {
        if (!this.stillLoading) {
            return this._cleanItems[type].filter((item: Item) =>
                !name || item.name.toLowerCase() === name.toLowerCase(),
            );
        } else { return []; }
    }

    public castItemByType(item: Item, type: string = item.type): Item {
        if (type) {
            switch (type) {
                case 'adventuringgear':
                    return Object.assign(new AdventuringGear(), item);
                case 'alchemicalbombs':
                    return Object.assign(new AlchemicalBomb(), item);
                case 'alchemicalelixirs':
                    return Object.assign(new AlchemicalElixir(), item);
                case 'alchemicalpoisons':
                    return Object.assign(new AlchemicalPoison(), item);
                case 'alchemicaltools':
                    return Object.assign(new AlchemicalTool(), item);
                case 'ammunition':
                    return Object.assign(new Ammunition(), item);
                case 'armorrunes':
                    return Object.assign(new ArmorRune(), item);
                case 'armors':
                    return Object.assign(new Armor(), item);
                case 'helditems':
                    return Object.assign(new HeldItem(), item);
                case 'materialitems':
                    return Object.assign(new MaterialItem(), item);
                case 'oils':
                    return Object.assign(new Oil(), item);
                case 'otherconsumables':
                    return Object.assign(new OtherConsumable(), item);
                case 'otherconsumablesbombs':
                    return Object.assign(new OtherConsumableBomb(), item);
                case 'potions':
                    return Object.assign(new Potion(), item);
                case 'scrolls':
                    return Object.assign(new Scroll(), item);
                case 'shields':
                    return Object.assign(new Shield(), item);
                case 'snares':
                    return Object.assign(new Snare(), item);
                case 'talismans':
                    return Object.assign(new Talisman(), item);
                case 'wands':
                    return Object.assign(new Wand(), item);
                case 'weaponrunes':
                    return Object.assign(new WeaponRune(), item);
                case 'weapons':
                    return Object.assign(new Weapon(), item);
                case 'wornitems':
                    return Object.assign(new WornItem(), item);
                default:
                    return item;
            }
        } else {
            return item;
        }
    }

    public initializeItem(
        item: Partial<Item>,
        options: {
            preassigned?: boolean;
            newId?: boolean;
            resetPropertyRunes?: boolean;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): Item {
        options = {
            preassigned: false,
            newId: true,
            resetPropertyRunes: false,
            newPropertyRunes: [],
            ...options,
        };

        //If the item is modified with propertyRunes, the runes need to be filled.
        if (options.newPropertyRunes.length) {
            options.resetPropertyRunes = true;
        }

        //Every new item has to be re-assigned its class and iterate over its objects to reassign them as well.
        //Typescript does not seem to have the option to keep object properties' classes when assigning.
        let newItem: Item = JSON.parse(JSON.stringify(item));

        //Set preassigned if you have already given the item a Class. Otherwise it will be determined by the item's type.
        if (options.preassigned) {
            //Any is required because the incoming item's class is unknown in the code.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newItem = Object.assign(new (item.constructor as any)(), newItem);
        } else {
            newItem = this.castItemByType(newItem);
        }

        //Optionally, a new ID is assigned and updated on the item's activities and their spell gains.
        if (options.newId) {
            newItem.id = uuidv4();

            if (newItem instanceof Equipment || newItem instanceof Rune) {
                newItem.activities?.forEach((activity: ItemActivity) => {
                    activity.castSpells?.forEach(cast => {
                        if (cast.spellGain) {
                            cast.spellGain.id = uuidv4();
                        }
                    });
                });
            }

            if (newItem instanceof Equipment) {
                newItem.gainSpells?.forEach((choice: SpellChoice) => {
                    choice.id = uuidv4();
                });
            }
        }

        //Perform any merging before the item is recast.

        //For items (oils) that apply the same effect as a rune, load the rune into the item here.
        if (newItem instanceof Oil && newItem.runeEffect?.name) {
            const rune = this._cleanItems.weaponrunes.find(weaponRune => weaponRune.name === (newItem as Oil).runeEffect.name);

            if (rune) {
                newItem.runeEffect = Object.assign(new WeaponRune(), JSON.parse(JSON.stringify(rune))).recast(this._typeService, this);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += ` (${ newItem.name })`; });
            }
        }

        //Apply any new property runes here.
        if (options.newPropertyRunes.length) {
            newItem = Object.assign(newItem, { propertyRunes: options.newPropertyRunes });
        }

        //For base items that come with property Runes with name only, load the rune into the item here.
        if (
            options.resetPropertyRunes &&
            (
                newItem instanceof Weapon ||
                (newItem instanceof WornItem && newItem.isHandwrapsOfMightyBlows)
            ) &&
            newItem.propertyRunes?.length
        ) {
            const newRunes: Array<WeaponRune> = [];

            newItem.propertyRunes.forEach((rune: WeaponRune) => {
                const libraryItem = this._cleanItems.weaponrunes.find(newrune => newrune.name === rune.name);

                if (libraryItem) {
                    newRunes.push(this._typeService.merge(libraryItem, rune));
                }
            });
            newItem.propertyRunes = newRunes;
        }

        if (options.resetPropertyRunes && newItem instanceof Armor && newItem.propertyRunes?.length) {
            const newRunes: Array<ArmorRune> = [];

            newItem.propertyRunes.forEach((rune: ArmorRune) => {
                const libraryItem = this._cleanItems.armorrunes.find(newrune => newrune.name === rune.name);

                if (libraryItem) {
                    newRunes.push(this._typeService.merge(libraryItem, rune));
                }
            });
            newItem.propertyRunes = newRunes;
        }

        //For base items that come with material with name only, load the material into the item here.
        if (options.resetPropertyRunes && newItem instanceof Weapon && newItem.material?.length) {
            const newMaterials: Array<WeaponMaterial> = [];

            newItem.material.forEach((material: WeaponMaterial) => {
                const libraryItem = this._weaponMaterials.find(newMaterial => newMaterial.name === material.name);

                if (libraryItem) {
                    newMaterials.push(this._typeService.merge(libraryItem, material));
                }
            });
            newItem.material = newMaterials;
        }

        if (options.resetPropertyRunes && newItem instanceof Armor && newItem.material?.length) {
            const newMaterials: Array<ArmorMaterial> = [];

            newItem.material.forEach((material: ArmorMaterial) => {
                const libraryItem = this._armorMaterials.find(newMaterial => newMaterial.name === material.name);

                if (libraryItem) {
                    newMaterials.push(this._typeService.merge(libraryItem, material));
                }
            });
            newItem.material = newMaterials;
        }

        if (options.resetPropertyRunes && newItem instanceof Shield && newItem.material?.length) {
            const newMaterials: Array<ShieldMaterial> = [];

            newItem.material.forEach((material: ShieldMaterial) => {
                const libraryItem = this._shieldMaterials.find(newMaterial => newMaterial.name === material.name);

                if (libraryItem) {
                    newMaterials.push(this._typeService.merge(libraryItem, material));
                }
            });
            newItem.material = newMaterials;
        }

        newItem = newItem.recast(this._typeService, this);

        //Disable all hints.
        if (newItem instanceof Equipment) {
            newItem.hints.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            });
            newItem.propertyRunes.forEach(rune => {
                rune.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                });
            });
            newItem.oilsApplied.forEach(oil => {
                oil.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                });
            });
            newItem.material.forEach(material => {
                material.hints.forEach(hint => {
                    hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
                });
            });
        }

        return newItem;
    }

    public totalItemBulk(creature: Creature, item: Item, targetInventory: ItemCollection = null, including = true): number {
        // Sum up all the bulk of an item, including items granted by it and inventories it contains (or they contain).
        // If this item has granted other items, sum up the bulk of each of them.
        // If a targetInventory is given, don't count items in that inventory,
        // as we want to figure out if the whole package will fit into that inventory.
        let bulk = 0;

        if (including) {
            item.gainItems?.forEach(itemGain => {
                let found = 0;
                let stackBulk = '';
                let stackSize = 1;

                creature.inventories.filter(inventory => !targetInventory || inventory !== targetInventory).forEach(inventory => {
                    //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                    inventory[itemGain.type]
                        .filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem))
                        .forEach((invItem: Item) => {
                            if (invItem.canStack()) {
                                found += invItem.amount;
                                stackBulk = (invItem as Equipment).carryingBulk || invItem.bulk;
                                stackSize = (invItem as Consumable).stack || 1;
                            } else {
                                bulk += this.effectiveItemBulk(invItem, { carrying: true });
                                //If the granted item includes more items, add their bulk as well.
                                bulk += this.totalItemBulk(creature, invItem, targetInventory);
                            }
                        });
                });

                if (found && stackBulk && stackSize) {
                    //If one ore more stacked items were found, calculate the stack bulk accordingly.
                    const testItem = new Consumable();

                    testItem.bulk = stackBulk;
                    testItem.amount = Math.min(itemGain.amount, found);
                    testItem.stack = stackSize;
                    bulk += this.effectiveItemBulk(testItem, { carrying: false });
                }
            });
        }

        // If the item adds an inventory, add the sum bulk of that inventory, unless it's the target inventory.
        // The item will not be moved into the inventory in that case (handled during the move).
        if ((item as Equipment).gainInventory) {
            bulk += creature.inventories
                .find(inventory => inventory !== targetInventory && inventory.itemId === item.id)
                ?.totalBulk(false, true)
                || 0;
        }

        //Remove ugly decimal errors
        bulk = CutOffDecimals(bulk, 1);

        return bulk;
    }

    public effectiveItemBulk(item: Item, options: { carrying?: boolean; amount?: number }): number {
        options = {
            carrying: false,
            amount: item.amount, ...options,
        };

        const decimal = 10;

        //All bulk gets calculated at *10 to avoid rounding issues with decimals,
        //Then returned at /10
        let itemBulk = 0;
        //Use the item's carrying bulk if carrying is true.
        const bulkString = (options.carrying && (item as Equipment).carryingBulk) ? (item as Equipment).carryingBulk : item.effectiveBulk();

        switch (bulkString) {
            case '':
                break;
            case '-':
                break;
            case 'L':
                if (options.amount) {
                    itemBulk += Math.floor(options.amount / ((item as Consumable).stack ? (item as Consumable).stack : 1));
                } else {
                    itemBulk += 1;
                }

                break;
            default:
                if (options.amount) {
                    itemBulk +=
                        parseInt(bulkString, 10)
                        * decimal
                        * Math.floor(
                            options.amount
                            / (
                                (item as Consumable).stack
                                    ? (item as Consumable).stack
                                    : 1
                            ),
                        );
                } else {
                    itemBulk += parseInt(bulkString, 10) * decimal;
                }

                break;
        }

        itemBulk = Math.floor(itemBulk) / decimal;

        return itemBulk;
    }

    public updateGrantingItemBeforeTransfer(creature: Creature, item: Item): void {
        // If this item has granted other items, check how many of those still exist,
        // and update the item's granting list.
        item.gainItems?.forEach(itemGain => {
            let found = 0;

            creature.inventories.forEach(inventory => {
                //Count how many items you have that either have this ItemGain's id or, if stackable, its name.
                inventory[itemGain.type].filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem)).forEach((invItem: Item) => {
                    found += invItem.amount;
                    //Take the opportunity to update this item as well, in case it grants further items.
                    //Ideally, the granting items should not contain the same kind of stackable items, or the numbers will be wrong.
                    this.updateGrantingItemBeforeTransfer(creature, invItem);
                });
            });

            if (found < itemGain.amount) {
                itemGain.amount = found;
            }
        });
    }

    public packGrantingItemForTransfer(
        creature: Creature,
        item: Item,
        primaryItem: Item = item,
    ): { items: Array<Item>; inventories: Array<ItemCollection> } {
        //Collect all items and inventories granted by an item, including inventories contained in its granted items.
        //Does NOT and should not include the primary item itself.
        let items: Array<Item> = [];
        const inventories: Array<ItemCollection> = [];

        item.gainItems?.forEach(itemGain => {
            let toPack: number = itemGain.amount;

            creature.inventories.forEach(inventory => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then add as many of them into the package as the amount demands, and pack their contents as well.
                inventory[itemGain.type].filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem)).forEach((invItem: Item) => {
                    if (toPack) {
                        const moved = Math.min(toPack, invItem.amount);

                        toPack -= moved;

                        const newItem = this.castItemByType(
                            Object.assign(new Item(), JSON.parse(JSON.stringify(invItem))),
                        ).recast(this._typeService, this);

                        newItem.amount = moved;
                        items.push(newItem);

                        const included = this.packGrantingItemForTransfer(creature, invItem);

                        items.push(...included.items);
                        inventories.push(...included.inventories);
                    }
                });
            });
        });

        //If the item adds inventories, add a copy of them to the inventory list.
        if ((item as Equipment).gainInventory?.length) {
            inventories.push(
                ...creature.inventories
                    .filter(inventory => inventory.itemId === item.id)
                    .map(inventory =>
                        Object.assign(new ItemCollection(), JSON.parse(JSON.stringify(inventory)))
                            .recast(this._typeService, this),
                    ),
            );
        }

        //At this point, if this is the primary item, all nested items and inventories have been added. We can now clean up the stacks:
        if (item === primaryItem) {
            //If an inventory contains any items that grant more inventories, add those to the list as well, unless they are already in it.
            //In case of nested inventories, repeat until no new iventories are found.
            //We don't pack items granted by items in inventories.
            if (inventories.length) {
                let hasFoundNewInventoriesToCheck = true;

                while (hasFoundNewInventoriesToCheck) {
                    hasFoundNewInventoriesToCheck = false;
                    inventories.forEach(inv => {
                        inv.allEquipment()
                            .filter(invItem => invItem.gainInventory.length)
                            .forEach(invItem => {
                                const newInventories = creature.inventories
                                    .filter(foundInventory =>
                                        !inventories.some(collectedInventory => collectedInventory.id === foundInventory.id) &&
                                        foundInventory.itemId === invItem.id,
                                    );

                                if (newInventories.length) {
                                    hasFoundNewInventoriesToCheck = true;
                                    inventories.push(
                                        ...newInventories.map(inventory =>
                                            Object.assign(
                                                new ItemCollection(),
                                                JSON.parse(JSON.stringify(inventory)),
                                            ).recast(this._typeService, this),
                                        ),
                                    );
                                }
                            });
                    });
                }
            }

            // If any of the items are already in any of the inventories,
            // remove them from the items list.
            // Remove the primary item from the items list as well.
            items
                .filter(collectedItem =>
                    inventories.some(inv => inv[collectedItem.type].some(invItem => invItem.id === collectedItem.id)))
                .forEach(collectedItem => {
                    collectedItem.id = 'DELETE';
                });
            items = items.filter(collectedItem => collectedItem.id !== 'DELETE' && collectedItem.id !== primaryItem.id);

            // If the primary item is in one of the inventories, remove it from inventory.
            // It will be moved to the main inventory of the target creature instead.
            inventories.filter(inv => inv[primaryItem.type].some(invItem => invItem.id === primaryItem.id)).forEach(inv => {
                inv[primaryItem.type] = inv[primaryItem.type].filter(invItem => invItem.id !== primaryItem.id);
            });
        }

        return { items, inventories };
    }

    public cannotMoveItem(creature: Creature, item: Item, target: ItemCollection): string {
        if (target.itemId === item.id) {
            return 'You cannot put a container into itself.';
        }

        if (this.cannotFitItemInContainer(creature, item, target)) {
            return 'The selected inventory does not have enough room for the item.';
        }

        if (this._isContainerInContainerItem(creature, item, target)) {
            return 'The selected inventory is nested in this container item.';
        }

        return '';
    }

    public cannotFitItemInContainer(
        creature: Creature,
        item: Item,
        target: ItemCollection,
        options: { amount?: number; including?: boolean } = {},
    ): boolean {
        //All bulk results are multiplied by 10 to avoid decimal addition bugs.
        options = {
            amount: 0,
            including: true, ...options,
        };

        const decimal = 10;
        const freeLightItems = 9;

        let bulkLimit = target.bulkLimit;

        if (bulkLimit >= 1 && Math.floor(bulkLimit) === bulkLimit) {
            //For full bulk limits (2 rather than 4L, for example), allow 9 light items extra.
            bulkLimit = (bulkLimit * decimal) + freeLightItems;
        } else {
            bulkLimit *= decimal;
        }

        if (target instanceof ItemCollection) {
            if (bulkLimit) {
                const itemBulk = this.effectiveItemBulk(item, { carrying: true, amount: options.amount }) * decimal;
                const containedBulk = this.totalItemBulk(creature, item, target, options.including) * decimal;

                return ((target.totalBulk(false) * decimal) + itemBulk + containedBulk > bulkLimit);
            }
        }

        return false;
    }

    public moveItemLocally(
        creature: Creature,
        item: Item,
        targetInventory: ItemCollection,
        inventory: ItemCollection,
        characterService: CharacterService,
        amount = item.amount,
        including = true,
    ): void {
        if (targetInventory && targetInventory !== inventory && targetInventory.itemId !== item.id) {
            this.updateGrantingItemBeforeTransfer(creature, item);
            this._refreshService.prepareDetailToChange('Character', item.id);

            //Only move the item locally if the item still exists in the inventory.
            if (inventory?.[item.type]?.some(invItem => invItem === item)) {
                //If this item is moved between inventories of the same creature, you don't need to drop it explicitly.
                //Just push it to the new inventory and remove it from the old, but unequip it either way.
                //The item does need to be copied so we don't just move a reference.
                const movedItem = this.castItemByType(JSON.parse(JSON.stringify(item))).recast(this._typeService, this);

                //If the item is stackable, and a stack already exists in the target inventory, just add the amount to the stack.
                if (movedItem.canStack()) {
                    const targetItem = targetInventory[item.type].find((inventoryItem: Item) => inventoryItem.name === movedItem.name);

                    if (targetItem) {
                        targetItem.amount += amount;
                    } else {
                        targetInventory[item.type].push(movedItem);
                    }
                } else {
                    targetInventory[item.type].push(movedItem);
                }

                // If the amount is higher or exactly the same, remove the item from the old inventory.
                // If not, reduce the amount on the old item, then set that amount on the new item.
                if (amount >= item.amount) {
                    inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item);
                } else {
                    movedItem.amount = amount;
                    item.amount -= amount;
                }

                if (movedItem instanceof Equipment && movedItem.equipped) {
                    characterService.equipItem(creature, inventory, movedItem as Equipment, false);
                }

                if (movedItem instanceof Equipment && movedItem.invested) {
                    characterService.investItem(creature, inventory, movedItem as Equipment, false);
                }

                //Move all granted items as well.
                if (including) {
                    this._moveItemsGrantedByThisItem(creature, movedItem, targetInventory, inventory, characterService);
                }

                this._refreshService.prepareChangesByItem(
                    creature,
                    movedItem,
                    { characterService, activitiesService: this._activitiesService },
                );
            }
        }
    }

    public moveInventoryItemToLocalCreature(
        creature: Creature,
        targetCreature: SpellTarget,
        item: Item,
        inventory: ItemCollection,
        characterService: CharacterService,
        amount = item.amount,
    ): void {
        if (creature.type !== targetCreature.type) {
            this.updateGrantingItemBeforeTransfer(creature, item);

            const included = this.packGrantingItemForTransfer(creature, item);
            const toCreature = characterService.creatureFromType(targetCreature.type);
            const targetInventory = toCreature.inventories[0];

            //Iterate through the main item and all its granted items and inventories.
            [item].concat(included.items).forEach(includedItem => {
                //If any existing, stackable items are found, add this item's amount on top and finish.
                //If no items are found, add the new item and its included items to the inventory.
                let existingItems: Array<Item> = [];

                if (!includedItem.expiration && includedItem.canStack()) {
                    existingItems = targetInventory[includedItem.type]
                        .filter((existing: Item) => existing.name === includedItem.name && existing.canStack() && !includedItem.expiration);
                }

                if (existingItems.length) {
                    existingItems[0].amount += includedItem.amount;
                    //Update the item's gridicon to reflect its changed amount.
                    this._refreshService.setComponentChanged(existingItems[0].id);
                } else {
                    const movedItem = this.castItemByType(JSON.parse(JSON.stringify(includedItem))).recast(this._typeService, this);
                    const newLength = targetInventory[includedItem.type].push(movedItem);
                    const newItem = targetInventory[includedItem.type][newLength - 1];

                    characterService.processGrantedItem(toCreature, newItem, targetInventory, true, false, true, true);
                }
            });
            //Add included inventories and process all items inside them.
            included.inventories.forEach(includedInventory => {
                const newLength = toCreature.inventories.push(includedInventory);
                const newInventory = toCreature.inventories[newLength - 1];

                newInventory.allItems().forEach(invItem => {
                    characterService.processGrantedItem(toCreature, invItem, newInventory, true, false, true, true);
                });
            });

            //If the item still exists on the inventory, drop it with all its contents.
            if (inventory?.[item.type]?.some(invItem => invItem === item)) {
                characterService.dropInventoryItem(creature, inventory, item, false, true, true, amount);
            }

            this._refreshService.prepareDetailToChange(toCreature.type, 'inventory');
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
            this._refreshService.prepareDetailToChange(toCreature.type, 'effects');
            this._refreshService.prepareDetailToChange(creature.type, 'effects');
        }
    }

    public hasTooManySlottedAeonStones(creature: Creature): boolean {
        //If more than one wayfinder with slotted aeon stones is invested, you do not gain the benefits of any of them.
        return creature.inventories[0].wornitems
            .filter(item => item.isWayfinder && item.investedOrEquipped() && item.aeonStones.length)
            .length > Defaults.maxInvestedAeonStones;
    }

    public processConsumable(
        creature: Creature,
        characterService: CharacterService,
        conditionsService: ConditionsService,
        spellsService: SpellsService,
        item: Consumable,
    ): void {

        //Consumables don't do anything in manual mode, except be used up.
        if (!characterService.isManualMode()) {

            //One time effects
            if (item.onceEffects) {
                item.onceEffects.forEach(effect => {
                    characterService.processOnceEffect(creature, effect);
                });
            }

            //Apply conditions
            item.gainConditions.forEach(gain => {
                const newConditionGain = Object.assign(new ConditionGain(), gain).recast();

                characterService.addCondition(creature, newConditionGain, {}, { noReload: true });
            });

            //Cast Spells
            if (item instanceof Oil) {
                item.castSpells.forEach((cast: SpellCast) => {
                    cast.spellGain.duration = cast.duration;

                    const librarySpell = spellsService.spells(cast.name)[0];

                    if (librarySpell) {
                        characterService.spellsService.processSpell(librarySpell, true,
                            { characterService, itemsService: this, conditionsService },
                            { creature, target: creature.type, gain: cast.spellGain, level: cast.level },
                            { manual: true },
                        );
                    }
                });
            }

            //Gain Items on Activation
            if (item.gainItems.length) {
                item.gainItems.forEach(gainItem => {
                    gainItem.grantGrantedItem(
                        creature,
                        { sourceName: item.effectiveName(), grantingItem: item },
                        { characterService, itemsService: this },
                    );
                });
            }

        }

    }

    public restItems(creature: Creature, characterService: CharacterService): void {
        creature.inventories.forEach(inv => {
            const itemsToDrop = inv.allItems().filter(item => item.expiration === TimePeriods.UntilRest);

            //TO-DO: Verify that this still works without the while loop.
            itemsToDrop.forEach(item => {
                characterService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
            });
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');

            //Grant items that are granted by other items on rest.
            inv.allItems().filter(item => item.gainItems.length && item.investedOrEquipped())
                .forEach(item => {
                    item.gainItems.filter(gain => gain.on === 'rest').forEach(gainItem => {
                        gainItem.grantGrantedItem(
                            creature,
                            { sourceName: item.effectiveName(), grantingItem: item },
                            { characterService, itemsService: this },
                        );
                    });
                });
        });

        if (creature instanceof Character) {
            //If you have Scroll Savant, get a copy of each prepared scroll that lasts until the next rest.
            if (characterService.characterFeatsTaken(1, creature.level, { featName: 'Scroll Savant' }).length) {
                creature.class.spellCasting.filter(casting => casting.scrollSavant.length).forEach(casting => {
                    casting.scrollSavant.forEach(scroll => {
                        characterService.grantInventoryItem(
                            scroll,
                            { creature, inventory: creature.inventories[0] },
                            { resetRunes: false, changeAfter: false, equipAfter: false },
                        );
                    });
                });
            }

            //If you have Battleforger, all your battleforged items are reset.
            if (characterService.characterFeatsTaken(1, creature.level, { featName: 'Battleforger' }).length) {
                let shouldAttacksRefresh = false;
                let shouldDefenseRefresh = false;

                creature.inventories.forEach(inv => {
                    inv.weapons.forEach(weapon => {
                        if (weapon.battleforged) {
                            shouldAttacksRefresh = true;
                        }

                        weapon.battleforged = false;
                    });
                    inv.armors.forEach(armor => {
                        if (armor.battleforged) {
                            shouldDefenseRefresh = true;
                        }

                        armor.battleforged = false;
                    });
                    inv.wornitems.forEach(wornitem => {
                        if (wornitem.battleforged) {
                            shouldAttacksRefresh = true;
                        }

                        wornitem.battleforged = false;
                    });
                });

                if (shouldAttacksRefresh) {
                    this._refreshService.prepareDetailToChange('Character', 'attacks');
                }

                if (shouldDefenseRefresh) {
                    this._refreshService.prepareDetailToChange('Character', 'defense');
                }
            }

            //For feats that grant you an item on rest, grant these here and set an expiration until the next rest.
            characterService.featsService.characterFeats(creature.customFeats)
                .filter(feat => feat.gainItems.some(gain => gain.on === 'rest') && feat.have({ creature }, { characterService }))
                .forEach(feat => {
                    feat.gainItems.filter(gain => gain.on === 'rest').forEach(gainItem => {
                        gainItem.grantGrantedItem(creature, { sourceName: feat.name }, { characterService, itemsService: this });
                    });
                });
        }
    }

    public refocusItems(creature: Creature, characterService: CharacterService): void {
        creature.inventories.forEach(inv => {
            const itemsToDrop = inv.allItems().filter(item => item.expiration === TimePeriods.UntilRefocus);

            itemsToDrop.forEach(item => {
                characterService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
            });
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        });
    }

    public tickItems(creature: Creature, characterService: CharacterService, turns: number): void {
        creature.inventories.forEach(inv => {
            //Tick down and remove all items that expire.
            const itemsToDrop: Array<Item> = [];

            const expirationApplies = (item: Item): boolean => {
                switch (item.expiresOnlyIf) {
                    case 'equipped': return item.investedOrEquipped();
                    case 'unequipped': return !item.investedOrEquipped();
                    default: return true;
                }
            };

            inv.allItems().filter(item => item.expiration > 0 && expirationApplies(item))
                .forEach(item => {
                    item.expiration -= turns;

                    if (item.expiration <= 0) {
                        itemsToDrop.push(item);

                        if (item instanceof Equipment && item.gainInventory.length) {
                            //If a temporary container is destroyed, return all contained items to the main inventory.
                            creature.inventories
                                .filter(creatureInventory => creatureInventory.itemId === item.id)
                                .forEach(creatureInventory => {
                                    creatureInventory.allItems().forEach(invItem => {
                                        this.moveItemLocally(
                                            creature,
                                            invItem,
                                            creature.inventories[0],
                                            creatureInventory,
                                            characterService,
                                        );
                                    });
                                });
                        }
                    }

                    this._refreshService.prepareDetailToChange(creature.type, 'inventory');

                    if (item instanceof Shield && item.equipped) {
                        this._refreshService.prepareDetailToChange(creature.type, 'attacks');
                    }

                    if ((item instanceof Armor || item instanceof Shield) && item.equipped) {
                        this._refreshService.prepareDetailToChange(creature.type, 'defense');
                    }
                });
            inv.wands.filter(wand => wand.cooldown > 0).forEach(wand => {
                wand.cooldown = Math.max(wand.cooldown - turns, 0);
                this._refreshService.prepareDetailToChange(creature.type, 'inventory');
            });

            itemsToDrop.forEach(item => {
                characterService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
            });
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');

            inv.allItems().filter(item => item.oilsApplied && item.oilsApplied.length)
                .forEach(item => {
                    item.oilsApplied.filter(oil => oil.duration !== TimePeriods.Permanent).forEach(oil => {
                        oil.duration -= turns;

                        if (oil.duration <= 0) {
                            oil.name = 'DELETE';
                        }

                        this._refreshService.prepareDetailToChange(creature.type, 'inventory');

                        if (item instanceof Weapon && item.equipped) {
                            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
                        }

                        if ((item instanceof Armor || item instanceof Shield) && item.equipped) {
                            this._refreshService.prepareDetailToChange(creature.type, 'defense');
                        }
                    });
                    item.oilsApplied = item.oilsApplied.filter(oil => oil.name !== 'DELETE');
                });
        });
    }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public initialize(): void {
        //Initialize items once, but cleanup specialization effects and reset store and crafting items everytime thereafter.
        this._itemProperties = this._loadMeta(json_itemproperties, 'itemProperties', new ItemProperty());
        this._itemProperties =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                this._itemProperties,
                ['group', 'parent', 'key'],
                'custom item properties',
            ) as Array<ItemProperty>;
        this._armorMaterials = this._loadMeta(json_armormaterials, 'armorMaterials', new ArmorMaterial());
        this._armorMaterials =
            this._extensionsService.cleanupDuplicates(
                this._armorMaterials,
                'name',
                'armor materials',
            ) as Array<ArmorMaterial>;
        this._shieldMaterials = this._loadMeta(json_shieldmaterials, 'shieldMaterials', new ShieldMaterial());
        this._shieldMaterials =
            this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(
                this._shieldMaterials,
                ['name', 'itemFilter'],
                'shield materials',
            ) as Array<ShieldMaterial>;
        this._weaponMaterials = this._loadMeta(json_weaponmaterials, 'weaponMaterials', new WeaponMaterial());
        this._weaponMaterials =
            this._extensionsService.cleanupDuplicates(
                this._weaponMaterials,
                'name',
                'weapon materials',
            ) as Array<WeaponMaterial>;
        this._specializations = this._loadMeta(json_specializations, 'specializations', new Specialization());
        this._specializations =
            this._extensionsService.cleanupDuplicates(
                this._specializations,
                'name',
                'armor and weapon specializations',
            ) as Array<Specialization>;

        //Runes need to load before other items, because their content is copied into items that bear them.
        this._cleanItems.armorrunes =
            this._loadItemType(json_armorrunes, 'armorrunes', new ArmorRune(), 'armor runes');
        this._cleanItems.weaponrunes = this._loadItemType(json_weaponrunes, 'weaponrunes', new WeaponRune(), 'weapon runes');
        //Oils need to load after WeaponRunes, because they have to copy some of them.
        this._cleanItems.oils = this._loadItemType(json_oils, 'oils', new Oil(), 'oils');

        this._cleanItems.adventuringgear =
            this._loadItemType(json_adventuringgear, 'adventuringgear', new AdventuringGear(), 'adventuring gear');
        this._cleanItems.alchemicalbombs =
            this._loadItemType(json_alchemicalbombs, 'alchemicalbombs', new AlchemicalBomb(), 'alchemical bombs');
        this._cleanItems.alchemicalelixirs =
            this._loadItemType(json_alchemicalelixirs, 'alchemicalelixirs', new AlchemicalElixir(), 'alchemical elixirs');
        this._cleanItems.alchemicalpoisons =
            this._loadItemType(json_alchemicalpoisons, 'alchemicalpoisons', new AlchemicalPoison(), 'alchemical poisons');
        this._cleanItems.alchemicaltools =
            this._loadItemType(json_alchemicaltools, 'alchemicaltools', new AlchemicalTool(), 'alchemical tools');
        this._cleanItems.ammunition =
            this._loadItemType(json_ammunition, 'ammunition', new Ammunition(), 'ammunition');
        this._cleanItems.armors =
            this._loadItemType(json_armors, 'armors', new Armor(), 'armors');
        this._cleanItems.helditems =
            this._loadItemType(json_helditems, 'helditems', new HeldItem(), 'held items');
        this._cleanItems.materialitems =
            this._loadItemType(json_materialitems, 'materialitems', new MaterialItem(), 'materials');
        this._cleanItems.otherconsumables =
            this._loadItemType(json_otherconsumables, 'otherconsumables', new OtherConsumable(), 'other consumables');
        this._cleanItems.otherconsumablesbombs =
            this._loadItemType(json_otherconsumablesbombs, 'otherconsumablesbombs', new OtherConsumableBomb(), 'other consumables (bombs)');
        this._cleanItems.potions =
            this._loadItemType(json_potions, 'potions', new Potion(), 'potions');
        this._cleanItems.scrolls =
            this._loadItemType(json_scrolls, 'scrolls', new Scroll(), 'scrolls');
        this._cleanItems.shields =
            this._loadItemType(json_shields, 'shields', new Shield(), 'shields');
        this._cleanItems.snares =
            this._loadItemType(json_snares, 'snares', new Snare(), 'snares');
        this._cleanItems.talismans =
            this._loadItemType(json_talismans, 'talismans', new Talisman(), 'talismans');
        this._cleanItems.wands =
            this._loadItemType(json_wands, 'wands', new Wand(), 'wands');
        this._cleanItems.weapons =
            this._loadItemType(json_weapons, 'weapons', new Weapon(), 'weapons');
        this._cleanItems.wornitems =
            this._loadItemType(json_wornitems, 'wornitems', new WornItem(), 'worn items');

        //Make a copy of clean items for shop items and crafting items.
        this._storeItems = Object.assign(
            new ItemCollection(),
            JSON.parse(JSON.stringify(this._cleanItems)),
        ).recast(this._typeService, this);
        this._craftingItems = Object.assign(
            new ItemCollection(),
            JSON.parse(JSON.stringify(this._cleanItems)),
        ).recast(this._typeService, this);

        this._initialized = true;
    }

    public reset(): void {
        //Reset items and crafting items from clean items.
        this._storeItems = Object.assign(
            new ItemCollection(),
            JSON.parse(JSON.stringify(this._cleanItems)),
        ).recast(this._typeService, this);
        this._craftingItems = Object.assign(
            new ItemCollection(),
            JSON.parse(JSON.stringify(this._cleanItems)),
        ).recast(this._typeService, this);

        //Disable any active hint effects when loading a character, and reinitialize the hints.
        this._specializations.forEach(spec => {
            spec.recast();
            spec.hints?.forEach(hint => {
                hint.active = hint.active2 = hint.active3 = hint.active4 = hint.active5 = false;
            });
        });
    }

    private _isContainerInContainerItem(creature: Creature, item: Item, target: ItemCollection): boolean {
        //Check if the target inventory is contained in this item.
        let hasFoundContainerInItem = false;

        // If this item grants any inventories, check those inventories for whether they include any items that grant the target inventory.
        // Repeat for any included items that grant inventories themselves,
        // until we are certain that this inventory is not in this container, no matter how deep.
        const findContainerInItem = (testItem: Equipment): boolean =>
            creature.inventories
                .filter(inv => inv.itemId === testItem.id)
                .some(inv =>
                    inv.allEquipment()
                        .some(invItem => invItem.id === target.itemId) ||
                    inv.allEquipment()
                        .filter(invItem => invItem.gainInventory.length)
                        .some(invItem => findContainerInItem(invItem)));


        if (item instanceof Equipment && item.gainInventory?.length) {
            hasFoundContainerInItem = findContainerInItem(item);
        }

        return hasFoundContainerInItem;
    }

    private _moveItemsGrantedByThisItem(
        creature: Creature,
        item: Item,
        targetInventory: ItemCollection,
        inventory: ItemCollection,
        characterService: CharacterService,
    ): void {
        //If you are moving an item that grants other items, move those as well.
        //Only move items from inventories other than the target inventory, and start from the same inventory that the granting item is in.
        //If any of the contained items contain the the target inventory, that should be caught in move_InventoryItem.
        item.gainItems?.forEach(itemGain => {
            let toMove: number = itemGain.amount;

            [inventory].concat(creature.inventories.filter(inv => inv !== targetInventory && inv !== inventory)).forEach(inv => {
                //Find items that either have this ItemGain's id or, if stackable, its name.
                //Then move as many of them into the new inventory as the amount demands.
                inv[itemGain.type].filter((invItem: Item) => itemGain.isMatchingExistingItem(invItem)).forEach(invItem => {
                    if (toMove) {
                        if (!this.cannotMoveItem(creature, invItem, targetInventory)) {
                            const moved = Math.min(toMove, invItem.amount);

                            toMove -= moved;
                            this.moveItemLocally(creature, invItem, targetInventory, inv, characterService, moved);
                        }
                    }
                });
            });
        });
    }

    private _loadItemType<T extends AnyItemType>(
        data: { [fileContent: string]: Array<unknown> },
        target: string,
        prototype: T,
        listName = '',
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = data = this._extensionsService.extend(data, `items_${ target }`);

        //Initialize all clean items. Recasting happens in the initialization,
        // and the store and crafting items will be copied and recast afterwards.
        Object.keys(extendedData).forEach(key => {
            resultingData.push(...data[key].map(entry =>
                this.initializeItem(
                    Object.assign(Object.create(prototype), entry),
                    { preassigned: true, newId: false, resetPropertyRunes: true },
                ) as T,
            ));
        });
        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'id', listName);

        return resultingData;
    }

    private _loadMeta<T extends ArmorMaterial | ShieldMaterial | WeaponMaterial | Specialization | ItemProperty>(
        data: { [fileContent: string]: Array<unknown> },
        target: string,
        prototype: T,
    ): Array<T> {
        const resultingData: Array<T> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(entry =>
                Object.assign(Object.create(prototype), entry).recast(),
            ));
        });

        return resultingData;
    }

}
