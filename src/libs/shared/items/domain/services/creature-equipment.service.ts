import { computed, inject, Injectable, Signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Armor } from '../../util/models/armor';
import { Equipment } from '../../util/models/equipment';
import { ItemCollection } from '../../util/models/item-collection';
import { Shield } from '../../util/models/shield';
import { Weapon } from '../../util/models/weapon';
import { WornItem } from '../../util/models/worn-item';
import { ProcessingServiceProvider } from 'src/libs/app-shell/domain/services/processing-service-provider.service';
import { weaklyCachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';

@Injectable({
    providedIn: 'root',
})
export class CreatureEquipmentService {

    private readonly _psp = inject(ProcessingServiceProvider);

    private readonly _cache = {
        equippedCreatureArmor: new WeakMap<Creature, ReturnType<typeof this.equippedCreatureArmor$$>>(),
        equippedCreatureBracersOfArmor: new WeakMap<Creature, ReturnType<typeof this.equippedCreatureBracersOfArmor$$>>(),
        equippedCreatureShield: new WeakMap<Creature, ReturnType<typeof this.equippedCreatureShield$$>>(),
        equippedCreatureWeapons: new WeakMap<Creature, ReturnType<typeof this.equippedCreatureWeapons$$>>(),
        investedCreatureEquipment: new WeakMap<Creature, ReturnType<typeof this.investedCreatureEquipment$$>>(),
    };

    public equippedCreatureArmor$$(creature: Creature): Signal<Array<Armor>> {
        return weaklyCachedSignal(
            () => computed(() =>
                creature.mainInventory$$()
                    .equippedArmors$$(),
            ),
            { store: this._cache.equippedCreatureArmor, objKey: creature },
        );
    }

    public equippedCreatureBracersOfArmor$$(creature: Creature): Signal<Array<WornItem>> {
        return weaklyCachedSignal(
            () => computed(() =>
                creature.mainInventory$$()
                    .activeWornItems$$()
                    .filter(wornItem => wornItem.isBracersOfArmor),
            ),
            { store: this._cache.equippedCreatureBracersOfArmor, objKey: creature },
        );
    }

    public equippedCreatureShield$$(creature: Creature): Signal<Array<Shield>> {
        return weaklyCachedSignal(
            () => computed(() =>
                creature.mainInventory$$()
                    .equippedShields$$(),
            ),
            { store: this._cache.equippedCreatureShield, objKey: creature },
        );
    }

    public equippedCreatureWeapons$$(creature: Creature): Signal<Array<Weapon>> {
        return weaklyCachedSignal(
            () => computed(() =>
                creature.mainInventory$$()
                    .equippedWeapons$$(),
            ),
            { store: this._cache.equippedCreatureWeapons, objKey: creature },
        );
    }

    public investedCreatureEquipment$$(creature: Creature): Signal<Array<Equipment>> {
        return weaklyCachedSignal(
            () => computed(() =>
                creature.mainInventory$$()
                    .allEquipment$$()
                    .filter(item =>
                        item.invested()
                    && item.canInvest,
                    ),
            ),
            { store: this._cache.investedCreatureEquipment, objKey: creature },
        );
    }

    public equipItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
        equip = true,
        changeAfter = true,
        equipBasicItems = true,
    ): void {
        // Only allow equipping or unequipping for items that the creature can wear.
        // Only allow equipping items in inventories that aren't containers (i.e. the first two).
        // Unequip any item that lands here and can't be equipped.
        const isEquippedAtBeginning = item.equipped();

        const canEquip = (): boolean => (
            !inventory.itemId &&
            (
                item.name === 'Unarmored' ||
                // Animal companions can only equip items with the Companion trait (and the Unarmored armor)
                // Other creatures can not equip items with the Companion trait
                (creature.isAnimalCompanion() === item.traits.includes('Companion'))
            ) && (
                // Familiars cannot equip armor, weapons and shields. Other creatures can.
                creature.isFamiliar() ? !(item.isArmor() || item.isWeapon() || item.isShield()) : true
            )
        );

        item.equipped.set(equip && canEquip());

        if (!isEquippedAtBeginning && item.equipped()) {
            this._psp.inventoryItemProcessingService?.processEquippingItem(creature, inventory, item);
        } else if (isEquippedAtBeginning && !item.equipped) {
            this._psp.inventoryItemProcessingService?.processUnequippingItem(creature, inventory, item, equipBasicItems);
        }
    }

    public investItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
        invest = true,
    ): void {
        item.invested.set(invest);

        if (item.invested()) {
            this._psp.inventoryItemProcessingService?.processInvestingItem(creature, inventory, item);
        } else {
            this._psp.inventoryItemProcessingService?.processUninvestingItem(creature, item);
        }
    }

}
