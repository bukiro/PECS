import { inject, Injectable } from '@angular/core';
import { ToastService } from 'src/libs/app-shell/domain/services/toast.service';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { CharacterFeatsService } from 'src/libs/shared/feats/domain/services/character-feats.service';
import { Item } from '../../util/models/item';
import { ItemGain } from '../../util/models/item-gain';
import { Weapon } from '../../util/models/weapon';
import { ItemsDataService } from './items-data.service';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';
import { CharacterDeitiesService } from 'src/libs/shared/deities/domain/services/character-deities.service';
import { InventoryService } from './inventory.service';
import { ItemCollection } from '../../util/models/item-collection';

@Injectable({
    providedIn: 'root',
})
export class ItemGrantingService {

    private readonly _itemsDataService = inject(ItemsDataService);
    private readonly _toastService = inject(ToastService);
    private readonly _characterDeitiesService = inject(CharacterDeitiesService);
    private readonly _inventoryService = inject(InventoryService);
    private readonly _characterFeatsService = inject(CharacterFeatsService);

    public grantGrantedItem(
        itemGain: ItemGain,
        creature: Creature,
        { sourceName, grantingItem }: { sourceName?: string; grantingItem?: Item } = {},
    ): void {
        if (itemGain.special) {
            switch (itemGain.special) {
                case 'Favored Weapon':
                    this._grantFavoredWeapon(itemGain, creature, { sourceName, grantingItem });

                    break;
                default: break;
            }

            return;
        }

        const mainInventory = creature.mainInventory$$();

        if (!mainInventory) {
            return;
        }

        const newItem: Item | undefined =
            this._itemsDataService
                .cleanItems()
                .itemsOfType$$(itemGain.type.toLowerCase())()
                .find(item => itemGain.isMatchingItem(item));

        if (newItem) {
            if (newItem.canStack$$()) {
                this._grantStackableItem(newItem, { creature, inventory: mainInventory, itemGain });
            } else {
                this._grantSingularItem(newItem, { creature, inventory: mainInventory, itemGain, sourceName, grantingItem });
            }
        } else {
            if (itemGain.name) {
                this._toastService.show({
                    text:
                        `Failed granting ${ itemGain.type.toLowerCase() } item ${ itemGain.name } - item not found.`,
                });
            } else {
                this._toastService.show({
                    text:
                        `Failed granting ${ itemGain.type.toLowerCase() } item with id ${ itemGain.id } - item not found.`,
                });
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
            creature.inventories().forEach(inv => {
                if (!hasUsedAmount) {
                    inv.itemsOfType$$(itemGain.type.toLowerCase())()
                        .filter(item =>
                            options.requireGrantedItemID
                                ? itemGain.isMatchingExistingItem(item)
                                : itemGain.isMatchingItem(item),
                        )
                        .forEach(item => {
                            if (!hasUsedAmount) {
                                const amountToRemove = Math.min(remainingAmount, item.amount());

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
        if (!creature.isCharacter()) {
            return;
        }

        const mainDeity = this._characterDeitiesService.mainCharacterDeity$$();
        const syncretismDeity = this._characterFeatsService.characterHasFeatAtLevel$$('Favored Weapon (Syncretism)')()
            ? this._characterDeitiesService.syncretismDeity$$()()
            : undefined;

        const deities = [mainDeity, syncretismDeity].filter(isDefined);

        if (deities.length) {
            const favoredWeaponNames = deities.map(deity => deity?.favoredWeapon ?? []).flat();

            if (favoredWeaponNames.length) {
                const favoredWeapons: Array<Weapon> =
                    this._itemsDataService.cleanItems().weapons()
                        .filter(weapon => favoredWeaponNames.includes(weapon.name));

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
                    this._toastService.show({
                        text:
                            'You did not gain your deity\'s favored weapon because no weapon by that name could be found.',
                    });
                }
            } else {
                this._toastService.show({
                    text:
                        'You did not gain your deity\'s favored weapon because your deity has no favored weapon.',
                });
            }
        } else {
            this._toastService.show({
                text:
                    'You did not gain your deity\'s favored weapon because you have no deity.',
            });
        }
    }

    private _grantSingularItem(
        item: Item,
        {
            creature,
            itemGain,
            inventory,
            sourceName,
            grantingItem,
        }: {
            creature: Creature;
            itemGain: ItemGain;
            inventory: ItemCollection;
            sourceName?: string;
            grantingItem?: Item;
        },
    ): void {
        let shouldEquip = true;

        // Don't equip the new item if it's a shield or armor and the granting one is too
        // - only one shield or armor can be equipped.
        if (
            grantingItem &&
            (
                (item.isArmor() && grantingItem.isArmor())
                || (item.isShield() && grantingItem.isShield())
            )
        ) {
            shouldEquip = false;
        }

        const grantedItem =
            this._inventoryService.grantInventoryItem(
                item,
                {
                    creature,
                    inventory,
                    amount: 1,
                },
                {
                    resetRunes: false,
                    equipAfter: shouldEquip,
                    expiration: itemGain.expiration,
                    newPropertyRunes: itemGain.newPropertyRunes,
                });

        // For non-stackable items, track the ID of the newly added item for removal.
        itemGain.grantedItemID = grantedItem.id;
        grantedItem.expiresOnlyIf = itemGain.expiresOnlyIf;

        if (itemGain.unhideAfterGrant) {
            grantedItem.hide = false;
        }

        if (sourceName) {
            grantedItem.grantedBy = `(Granted by ${ sourceName })`;
        }
    }

    private _grantStackableItem<T extends Item>(
        item: T,
        {
            creature,
            inventory,
            itemGain,
        }: {
            creature: Creature;
            inventory: ItemCollection;
            itemGain: ItemGain;
        },
    ): void {
        //For stackables, add the appropriate amount and don't track them.
        const grantedItem =
            this._inventoryService.grantInventoryItem(
                item,
                {
                    creature,
                    inventory,
                    amount: (itemGain.amount + (itemGain.amountPerLevel * creature.level())),
                },
                {
                    resetRunes: false,
                    equipAfter: false,
                    expiration: itemGain.expiration,
                });

        if (itemGain.unhideAfterGrant) {
            grantedItem.hide = false;
        }

    }
}
