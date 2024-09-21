import { Injectable } from '@angular/core';
import { zip, take } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';

@Injectable({
    providedIn: 'root',
})
export class ItemsTimeService {

    constructor(
        private readonly _itemTransferService: ItemTransferService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _inventoryService: InventoryService,
    ) { }

    public restItems(creature: Creature): void {
        creature.inventories.forEach(inv => {
            const itemsToDrop = inv.allItems().filter(item => item.expiration === TimePeriods.UntilRest);

            itemsToDrop.forEach(item => {
                this._inventoryService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
            });

            //Grant items that are granted by other items on rest.
            inv.allItems().filter(item => item.gainItems.length && item.investedOrEquipped())
                .forEach(item => {

                    item.gainItems.filter(gain => gain.on === 'rest').forEach(gainItem => {
                        this._itemGrantingService.grantGrantedItem(
                            gainItem,
                            creature,
                            { sourceName: item.effectiveNameSnapshot(), grantingItem: item },
                        );
                    });
                });
        });

        if (creature.isCharacter()) {
            zip([
                this._characterFeatsService.characterHasFeatAtLevel$('Scroll Savant'),
                this._characterFeatsService.characterHasFeatAtLevel$('Battleforger'),
                this._characterFeatsService.characterFeatsAtLevel$(),
            ])
                .pipe(
                    take(1),
                )
                .subscribe(([hasScrollSavant, hasBattleforger, allFeats]) => {
                    //If you have Scroll Savant, get a copy of each prepared scroll that lasts until the next rest.
                    if (hasScrollSavant) {
                        creature.class.spellCasting.filter(casting => casting.scrollSavant.length).forEach(casting => {
                            casting.scrollSavant.forEach(scroll => {
                                this._inventoryService.grantInventoryItem(
                                    scroll,
                                    { creature, inventory: creature.mainInventory },
                                    { resetRunes: false, changeAfter: false, equipAfter: false },
                                );
                            });
                        });
                    }

                    //If you have Battleforger, all your battleforged items are reset.
                    if (hasBattleforger) {

                        creature.inventories.forEach(inv => {
                            inv.weapons.forEach(weapon => {
                                weapon.battleforged = false;
                            });
                            inv.armors.forEach(armor => {
                                armor.battleforged = false;
                            });
                            inv.wornitems.forEach(wornitem => {
                                wornitem.battleforged = false;
                            });
                        });
                    }

                    //For feats that grant you an item on rest, grant these here and set an expiration until the next rest.
                    allFeats
                        .filter(feat =>
                            feat.gainItems.some(gain => gain.on === 'rest'),
                        )
                        .forEach(feat => {
                            feat.gainItems.filter(gain => gain.on === 'rest').forEach(gainItem => {
                                this._itemGrantingService.grantGrantedItem(gainItem, creature, { sourceName: feat.name });
                            });
                        });
                });
        }
    }

    public refocusItems(creature: Creature): void {
        creature.inventories.forEach(inv => {
            const itemsToDrop = inv.allItems().filter(item => item.expiration === TimePeriods.UntilRefocus);

            itemsToDrop.forEach(item => {
                this._inventoryService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
            });
        });
    }

    public tickItems(creature: Creature, turns: number): void {
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
                                        this._itemTransferService.moveItemLocally(
                                            creature,
                                            invItem,
                                            creature.mainInventory,
                                            creatureInventory,
                                        );
                                    });
                                });
                        }
                    }
                });
            inv.wands.filter(wand => wand.cooldown > 0).forEach(wand => {
                wand.cooldown = Math.max(wand.cooldown - turns, 0);
            });

            itemsToDrop.forEach(item => {
                this._inventoryService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
            });

            inv.allItems().filter(item => item.oilsApplied && item.oilsApplied.length)
                .forEach(item => {
                    item.oilsApplied.filter(oil => oil.duration !== TimePeriods.Permanent).forEach(oil => {
                        oil.duration -= turns;

                        if (oil.duration <= 0) {
                            oil.name = 'DELETE';
                        }
                    });
                    item.oilsApplied = item.oilsApplied.filter(oil => oil.name !== 'DELETE');
                });
        });
    }

}
