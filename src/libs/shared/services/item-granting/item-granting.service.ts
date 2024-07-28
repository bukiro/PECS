/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { combineLatest, switchMap, of, take, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Armor } from 'src/app/classes/items/armor';
import { Item } from 'src/app/classes/items/item';
import { ItemGain } from 'src/app/classes/items/item-gain';
import { Shield } from 'src/app/classes/items/shield';
import { Weapon } from 'src/app/classes/items/weapon';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { ItemsDataService } from '../data/items-data.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable({
    providedIn: 'root',
})
export class ItemGrantingService {

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _toastService: ToastService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _inventoryService: InventoryService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public grantGrantedItem(
        itemGain: ItemGain,
        creature: Creature,
        context: { sourceName?: string; grantingItem?: Item } = {},
    ): void {
        if (itemGain.special) {
            switch (itemGain.special) {
                case 'Favored Weapon':
                    this._grantFavoredWeapon(itemGain, creature, context);

                    break;
                default: break;
            }
        } else {
            const mainInventory = creature.mainInventory;

            if (!mainInventory) {
                return;
            }

            const newItem: Item | undefined =
                this._itemsDataService.cleanItems().itemsOfType(itemGain.type.toLowerCase())
                    .find(item => itemGain.isMatchingItem(item));

            if (newItem) {
                if (newItem.canStack()) {
                    //For stackables, add the appropriate amount and don't track them.
                    const grantedItem =
                        this._inventoryService.grantInventoryItem(
                            newItem,
                            {
                                creature,
                                inventory: mainInventory,
                                amount: (itemGain.amount + (itemGain.amountPerLevel * creature.level)),
                            },
                            {
                                resetRunes: false,
                                changeAfter: false,
                                equipAfter: false,
                                expiration: itemGain.expiration,
                            });

                    if (itemGain.unhideAfterGrant) {
                        grantedItem.hide = false;
                    }
                } else {
                    // For non-stackables, track the ID of the newly added item for removal.
                    // Don't equip the new item if it's a shield or armor and the granting one is too
                    // - only one shield or armor can be equipped.
                    let shouldEquip = true;

                    if (
                        context.grantingItem &&
                        (
                            (newItem instanceof Armor || newItem instanceof Shield) &&
                            newItem instanceof context.grantingItem.constructor
                        )
                    ) {
                        shouldEquip = false;
                    }

                    const grantedItem =
                        this._inventoryService.grantInventoryItem(
                            newItem,
                            {
                                creature,
                                inventory: mainInventory,
                                amount: 1,
                            },
                            {
                                resetRunes: false,
                                changeAfter: false,
                                equipAfter: shouldEquip,
                                expiration: itemGain.expiration,
                                newPropertyRunes: itemGain.newPropertyRunes,
                            });

                    itemGain.grantedItemID = grantedItem.id;
                    grantedItem.expiresOnlyIf = itemGain.expiresOnlyIf;

                    if (itemGain.unhideAfterGrant) {
                        grantedItem.hide = false;
                    }

                    if (!grantedItem.canStack() && context.sourceName) {
                        grantedItem.grantedBy = `(Granted by ${ context.sourceName })`;
                    }
                }
            } else {
                if (itemGain.name) {
                    this._toastService.show(
                        `Failed granting ${ itemGain.type.toLowerCase() } item ${ itemGain.name } - item not found.`,
                    );
                } else {
                    this._toastService.show(
                        `Failed granting ${ itemGain.type.toLowerCase() } item with id ${ itemGain.id || 0 } - item not found.`,
                    );
                }
            }
        }
    }

    public dropGrantedItem(
        itemGain: ItemGain,
        creature: Creature,
        options: { requireGrantedItemID?: boolean } = {},
    ): void {
        options = {
            requireGrantedItemID: true, ...options,
        };

        let hasUsedAmount = false;
        let remainingAmount = itemGain.amount;

        if (itemGain.special) {
            const multipleGrantedItemIDs: Array<string> = itemGain.grantedItemID.split(',');

            switch (itemGain.special) {
                case 'Favored Weapon':
                    multipleGrantedItemIDs.forEach(id => {
                        const newGain = itemGain.clone();

                        newGain.special = '';
                        newGain.id = '';
                        newGain.name = '';
                        newGain.grantedItemID = id;

                        this.dropGrantedItem(newGain, creature, { requireGrantedItemID: true });
                    });
                    itemGain.grantedItemID = '';
                    break;
                default: break;
            }
        } else {
            creature.inventories.forEach(inv => {
                if (!hasUsedAmount) {
                    inv.itemsOfType(itemGain.type.toLowerCase())
                        .filter(item =>
                            options.requireGrantedItemID
                                ? itemGain.isMatchingExistingItem(item)
                                : itemGain.isMatchingItem(item),
                        )
                        .forEach(item => {
                            if (!hasUsedAmount) {
                                const amountToRemove = Math.min(remainingAmount, item.amount);

                                remainingAmount -= amountToRemove;
                                this._inventoryService.dropInventoryItem(creature, inv, item, false, true, true, amountToRemove, true);

                                if (remainingAmount <= 0) {
                                    hasUsedAmount = true;
                                }
                            }
                        });
                }
            });
            itemGain.grantedItemID = '';
        }
    }

    private _grantFavoredWeapon(
        itemGain: ItemGain,
        creature: Creature,
        context: { sourceName?: string; grantingItem?: Item } = {},
    ): void {
        if (creature.isCharacter()) {
            combineLatest([
                this._characterDeitiesService.mainCharacterDeity$,
                this._characterFeatsService.characterHasFeatAtLevel$('Favored Weapon (Syncretism)')
                    .pipe(
                        switchMap(hasFavoredWeaponSyncretism =>
                            hasFavoredWeaponSyncretism
                                ? this._characterDeitiesService.syncretismDeity$()
                                : of(null),
                        ),
                    ),
            ])
                .pipe(
                    take(1),
                    map(deities => {
                        if (deities.length) {
                            const favoredWeaponNames = new Array<string>()
                                .concat(...deities.map(deity => deity?.favoredWeapon ?? []));

                            if (favoredWeaponNames.length) {
                                const favoredWeapons: Array<Weapon> =
                                    this._itemsDataService.cleanItems().weapons.filter(weapon => favoredWeaponNames.includes(weapon.name));

                                if (favoredWeapons.length) {
                                    const grantedItemIDs: Array<string> = [];

                                    favoredWeapons.forEach(weapon => {
                                        const newGain: ItemGain = itemGain.clone();

                                        newGain.special = '';
                                        newGain.id = weapon.id;

                                        this.grantGrantedItem(newGain, creature, context);
                                        grantedItemIDs.push(newGain.grantedItemID);
                                    });
                                    itemGain.grantedItemID = grantedItemIDs.join(',');
                                } else {
                                    this._toastService.show(
                                        'You did not gain your deity\'s favored weapon because no weapon by that name could be found.',
                                    );
                                }
                            } else {
                                this._toastService.show(
                                    'You did not gain your deity\'s favored weapon because your deity has no favored weapon.',
                                );
                            }
                        } else {
                            this._toastService.show(
                                'You did not gain your deity\'s favored weapon because you have no deity.',
                            );
                        }
                    }),
                );
        }
    }
}
