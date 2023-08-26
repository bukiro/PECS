import { Injectable } from '@angular/core';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Armor } from 'src/app/classes/Armor';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { Item } from 'src/app/classes/Item';
import { Shield } from 'src/app/classes/Shield';
import { Weapon } from 'src/app/classes/Weapon';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { take, zip } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ItemsTimeService {

    constructor(
        private readonly _itemTransferService: ItemTransferService,
        private readonly _refreshService: RefreshService,
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
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');

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
                                    { creature, inventory: creature.inventories[0] },
                                    { resetRunes: false, changeAfter: false, equipAfter: false },
                                );
                            });
                        });
                    }

                    //If you have Battleforger, all your battleforged items are reset.
                    if (hasBattleforger) {
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
                            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                        }

                        if (shouldDefenseRefresh) {
                            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                        }
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
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
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
                                            creature.inventories[0],
                                            creatureInventory,
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
                this._inventoryService.dropInventoryItem(creature, inv, item, false, true, true, item.amount);
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

}
