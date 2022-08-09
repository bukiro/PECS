import { Injectable } from '@angular/core';
import { Armor } from 'src/app/classes/Armor';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { ItemGain } from 'src/app/classes/ItemGain';
import { Shield } from 'src/app/classes/Shield';
import { Weapon } from 'src/app/classes/Weapon';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { ToastService } from 'src/app/services/toast.service';

@Injectable({
    providedIn: 'root',
})
export class ItemGrantingService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _itemsService: ItemsService,
        private readonly _toastService: ToastService,
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
            const newItem: Item =
                this._itemsService.cleanItems()[itemGain.type.toLowerCase()].find((item: Item) => itemGain.isMatchingItem(item));

            if (newItem) {
                if (newItem.canStack()) {
                    //For stackables, add the appropriate amount and don't track them.
                    const grantedItem =
                        this._characterService.grantInventoryItem(
                            newItem,
                            {
                                creature,
                                inventory: creature.inventories[0],
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
                        this._characterService.grantInventoryItem(
                            newItem,
                            {
                                creature,
                                inventory: creature.inventories[0],
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
                        const newGain =
                            Object.assign<ItemGain, ItemGain>(
                                new ItemGain(),
                                { ...JSON.parse(JSON.stringify(itemGain)), special: '', id: '', name: '', grantedItemID: id },
                            );

                        this.dropGrantedItem(newGain, creature, { requireGrantedItemID: true });
                    });
                    itemGain.grantedItemID = '';
                    break;
                default: break;
            }
        } else {
            creature.inventories.forEach(inv => {
                if (!hasUsedAmount) {
                    inv[itemGain.type]
                        .filter((item: Item) =>
                            options.requireGrantedItemID
                                ? itemGain.isMatchingExistingItem(item)
                                : itemGain.isMatchingItem(item),
                        )
                        .forEach((item: Item) => {
                            if (!hasUsedAmount) {
                                const amountToRemove = Math.min(remainingAmount, item.amount);

                                remainingAmount -= amountToRemove;
                                this._characterService.dropInventoryItem(creature, inv, item, false, true, true, amountToRemove, true);

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
        const character = this._characterService.character;
        const deities = this._characterService.currentCharacterDeities(character);

        if (deities.length) {
            const favoredWeaponNames: Array<string> = [];
            const deity = this._characterService.currentCharacterDeities(character)[0];

            if (deity && deity.favoredWeapon.length) {
                favoredWeaponNames.push(...deity.favoredWeapon);
            }

            if (
                this._characterService.characterFeatsTaken(
                    1,
                    creature.level,
                    { featName: 'Favored Weapon (Syncretism)' },
                ).length
            ) {
                favoredWeaponNames.push(
                    ...(
                        this._characterService.currentCharacterDeities(character, 'syncretism')[0]?.favoredWeapon ||
                        []
                    ),
                );
            }

            if (favoredWeaponNames.length) {
                const favoredWeapons: Array<Weapon> =
                    this._itemsService.cleanItems().weapons.filter(weapon => favoredWeaponNames.includes(weapon.name));

                if (favoredWeapons.length) {
                    const grantedItemIDs: Array<string> = [];

                    favoredWeapons.forEach(weapon => {
                        const newGain: ItemGain =
                            Object.assign<ItemGain, ItemGain>(
                                new ItemGain(),
                                {
                                    ...JSON.parse(JSON.stringify(itemGain)),
                                    special: '',
                                    id: weapon.id,
                                },
                            ).recast();

                        this.grantGrantedItem(newGain, creature, context);
                        grantedItemIDs.push(newGain.grantedItemID);
                    });
                    itemGain.grantedItemID = grantedItemIDs.join(',');
                } else {
                    this._toastService.show(
                        'You did not gain your deity\'s favored weapon because it could not be found.',
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
    }

}
