/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Oil } from 'src/app/classes/items/oil';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ArmorClassService } from 'src/libs/shared/services/armor-class/armor-class.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';

@Injectable({
    providedIn: 'root',
})
export class InventoryItemProcessingService {

    constructor(
        private readonly _featsDataService: FeatsDataService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _toastService: ToastService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _armorClassService: ArmorClassService,
        private readonly _basicEquipmentService: BasicEquipmentService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public processGrantedItem(
        creature: Creature,
        item: Item,
        inventory: ItemCollection,
        equip = true,
        resetRunes = true,
        skipGrantedItems = false,
        skipGainedInventories = false,
    ): void {
        inventory.touched.set(true);

        //Disable activities on equipment and runes.
        if (item.hasActivities()) {
            item.activities.forEach(activity => {
                activity.active.set(false);
            });
        }

        if (item.isEquipment()) {
            this._processGrantedEquipment(creature, item, inventory, equip, resetRunes, skipGrantedItems, skipGainedInventories);
        }
    }

    public processDroppingItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Item,
        including = true,
        keepInventoryContent = false,
        inventoryService: InventoryService,
    ): void {
        const character = CreatureService.character$$();

        if (item.hasActivities()) {
            item.activities.forEach(activity => {
                if (activity.active()) {
                    this._psp.activitiesProcessingService?.activateActivity(
                        activity,
                        false,
                        {
                            creature,
                            gain: activity,
                        },
                    );
                }
            });
        }

        if (item.isEquipment()) {
            this._processDroppingEquipment(creature, inventory, item, including, keepInventoryContent, inventoryService);
        }

        item.oilsApplied()
            .filter(oil => oil.runeEffect?.loreChoices.length)
            .forEach((oil: Oil) => {
                this._characterLoreService.removeRuneLore(oil.runeEffect);
            });

        if (item.isWeapon()) {
            character.markUnneededWeaponFeatsForDeletion(item);
        }
    }

    public processEquippingItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
    ): void {
        if (item.isArmor()) {
            inventory.armors()
                .filter(armor => armor.equipped() && armor !== item)
                .forEach(armor => {
                    this._creatureEquipmentService.equipItem(creature, inventory, armor, false, false, false);
                });
        }

        if (item.isShield()) {
            inventory.shields()
                .filter(shield => shield.equipped() && shield !== item)
                .forEach(shield => {
                    this._creatureEquipmentService.equipItem(creature, inventory, shield, false, false, false);
                });
        }

        // If you get an Activity from an item that doesn't need to be invested,
        // immediately invest it in secret so the Activity is gained
        if ((item.gainActivities || item.activities) && !item.canInvest) {
            this._creatureEquipmentService.investItem(creature, inventory, item, true);
        }

        // Add all Items that you get from equipping this one.
        if (item.gainItems().length) {
            item.gainItems()
                .filter(gainItem => gainItem.on === 'equip')
                .forEach(gainItem => {
                    this._itemGrantingService.grantGrantedItem(
                        gainItem,
                        creature,
                        { sourceName: item.effectiveName$$()(), grantingItem: item },
                    );
                });
        }
    }

    public processUnequippingItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
        equipBasicItems = true,
    ): void {
        const character = CreatureService.character$$();

        if (equipBasicItems) {
            this._basicEquipmentService.equipBasicItems(creature);
        }

        //If you are unequipping a shield, you should also be lowering it and losing cover
        if (item.isShield()) {
            if (item.takingCover) {
                this._armorClassService.setCover(creature, 0, item);
            }

            item.raised = false;
        }

        //If the item was invested, it isn't now.
        if (item.invested) {
            this._creatureEquipmentService.investItem(creature, inventory, item, false);
        }

        if (item.gainItems().length) {
            item.gainItems()
                .filter(gainItem => gainItem.on === 'equip')
                .forEach(gainItem => {
                    this._itemGrantingService.dropGrantedItem(gainItem, creature);
                });
        }

        //If the item can't be un-invested, make sure you lose the conditions you gained from equipping it.
        if (!item.canInvest) {
            this._creatureConditionRemovalService.removeGainedItemConditions(item, creature);
        }

        item.propertyRunes().forEach(rune => {
            //Deactivate any active toggled activities of inserted runes.
            rune.activities.filter(activity => activity.toggle && activity.active()).forEach(activity => {
                this._psp.activitiesProcessingService?.activateActivity(
                    activity,
                    false,
                    {
                        creature: character,
                        target: CreatureTypes.Character,
                        gain: activity,
                    },
                );
            });
        });
    }

    public processInvestingItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
    ): void {
        if (!item.equipped) {
            this._creatureEquipmentService.equipItem(creature, inventory, item, true, false);
        }
    }

    public processUninvestingItem(
        creature: Creature,
        item: Equipment,
    ): void {
        item.gainActivities.filter(gainActivity => gainActivity.active).forEach((gainActivity: ActivityGain) => {
            const libraryActivity = this._activitiesDataService.activities(gainActivity.name)[0];

            if (libraryActivity) {
                this._psp.activitiesProcessingService?.activateActivity(
                    libraryActivity,
                    false,
                    {
                        creature,
                        gain: gainActivity,
                    },
                );
            }
        });
        item.activities.filter(itemActivity => itemActivity.active).forEach((itemActivity: ItemActivity) => {
            this._psp.activitiesProcessingService?.activateActivity(
                itemActivity,
                false,
                {
                    creature,
                    gain: itemActivity,
                },
            );
        });
        this._creatureConditionRemovalService.removeGainedItemConditions(item, creature);
    }

    private _processGrantedEquipment(
        creature: Creature,
        item: Equipment,
        inventory: ItemCollection,
        equip = true,
        resetRunes = true,
        skipGrantedItems = false,
        skipGainedInventories = false,
    ): void {
        const character = CreatureService.character$$();

        if (item.gainActivities?.length) {
            item.gainActivities.forEach(gain => {
                gain.active.set(false);
            });
        }

        if (equip && Object.prototype.hasOwnProperty.call(item, 'equipped') && item.equippable) {
            this._creatureEquipmentService.equipItem(creature, inventory, item, true, false);
        }

        if (item.isWeapon()) {
            const customFeats = this._featsDataService.createWeaponFeats([item]);

            customFeats.forEach(customFeat => {
                const oldFeat = character.customFeats().find(existingFeat => existingFeat.name === customFeat.name);

                if (oldFeat) {
                    character.removeCustomFeat(oldFeat);
                }

                character.addCustomFeat(customFeat);
            });
        }

        if (resetRunes && item.moddable) {
            item.potencyRune.set(0);
            item.strikingRune.set(0);
            item.resilientRune.set(0);
            item.propertyRunes.set([]);
        }

        item.propertyRunes()
            .filter(rune => rune.loreChoices?.length)
            .forEach(rune => {
                this._characterLoreService.addRuneLore(rune);
            });

        if (!skipGainedInventories) {
            //Add all Inventories that you get from this item.
            if (item.gainInventory) {
                item.gainInventory.forEach(gain => {
                    creature.inventories.update(value => [
                        ...value,
                        Object.assign<ItemCollection, Partial<ItemCollection>>(
                            new ItemCollection(),
                            {
                                itemId: item.id,
                                bulkLimit: gain.bulkLimit,
                                bulkReduction: gain.bulkReduction,
                            },
                        ),
                    ]);
                });
            }
        }

        if (!skipGrantedItems && item.gainItems.length) {
            // Add all Items that you get from being granted this one.
            item.gainItems()
                .filter(gainItem => gainItem.on === 'grant' && gainItem.amount > 0)
                .forEach(gainItem => {
                    this._itemGrantingService.grantGrantedItem(
                        gainItem,
                        creature,
                        { sourceName: item.effectiveName$$()(), grantingItem: item },
                    );
                });
        }
    }

    private _processDroppingEquipment(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
        including = true,
        keepInventoryContent = false,
        inventoryService: InventoryService,
    ): void {
        if (item.equipped()) {
            this._creatureEquipmentService.equipItem(creature, inventory, item, false, false);
        } else if (item.invested && item.canInvest) {
            this._creatureEquipmentService.investItem(creature, inventory, item, false);
        } else if (!item.equippable && !item.canInvest) {
            this._creatureConditionRemovalService.removeGainedItemConditions(item, creature);
        }

        item.propertyRunes()
            .filter(rune => rune.loreChoices.length)
            .forEach(rune => {
                this._characterLoreService.removeRuneLore(rune);
            });

        item.gainActivities.forEach(gain => {
            if (gain.active()) {
                const activity = this._activitiesDataService.activities(gain.name)[0];

                if (activity) {
                    this._psp.activitiesProcessingService?.activateActivity(
                        activity,
                        false,
                        {
                            creature,
                            gain,
                        },
                    );
                }
            }
        });

        if (item.gainInventory?.length) {
            if (keepInventoryContent) {
                this._preserveInventoryContentBeforeDropping(creature, item);
            } else {
                creature.inventories()
                    .filter(existingInventory => existingInventory.itemId === item.id)
                    .forEach(gainedInventory => {
                        gainedInventory.allItems$$()
                            .forEach(inventoryItem => {
                                inventoryService.dropInventoryItem(creature, gainedInventory, inventoryItem, false, false, including);
                            });
                    });
            }

            creature.inventories.update(value => value.filter(existingInventory => existingInventory.itemId !== item.id));
        }

        if (including) {
            item.gainItems()
                .filter(gainItem => gainItem.on === 'grant')
                .forEach(gainItem => {
                    this._itemGrantingService.dropGrantedItem(gainItem, creature);
                });
        }
    }

    private _preserveInventoryContentBeforeDropping(creature: Creature, item: Equipment): void {
        // This gets all inventories granted by an item and dumps them into the main inventory.
        // That way, content isn't lost when you drop an inventory item.
        let found = 0;

        creature.inventories()
            .filter(inv => inv.itemId === item.id)
            .forEach(inv => {
                inv.allItems$$()
                    .filter(invItem => invItem !== item)
                    .forEach(invItem => {
                        if (!invItem.markedForDeletion) {
                            found++;
                            this._itemTransferService
                                .moveItemLocally(creature, invItem, creature.mainInventory$$(), inv, invItem.amount, true);
                        }
                    });
            });

        if (found) {
            this._toastService.show(
                `${ found } item${ found > 1 ? 's' : '' } were emptied out of <strong>${ item.effectiveName$$()() }</strong> `
                + 'before dropping the item. These items can be found in your inventory, unless they were dropped in the same process.',
            );
        }
    }

}
