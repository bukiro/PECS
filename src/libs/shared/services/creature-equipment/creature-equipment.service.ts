import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Armor } from 'src/app/classes/items/armor';
import { Equipment } from 'src/app/classes/items/equipment';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Shield } from 'src/app/classes/items/shield';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureEquipmentService {

    constructor(
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public equippedCreatureArmor$(creature: Creature): Observable<Array<Armor>> {
        return creature.mainInventory.equippedArmors$;
    }

    public equippedCreatureBracersOfArmor$(creature: Creature): Observable<Array<WornItem>> {
        return creature.mainInventory.activeWornItems$
            .pipe(
                map(wornItems => wornItems.filter(wornItem => wornItem.isBracersOfArmor)),
            );
    }

    public equippedCreatureShield$(creature: Creature): Observable<Array<Shield>> {
        return creature.mainInventory.equippedShields$;
    }

    public equippedCreatureWeapons(creature: Creature): Observable<Array<Weapon>> {
        return creature.mainInventory.equippedWeapons$;
    }

    public investedCreatureEquipment$(creature: Creature): Observable<Array<Equipment>> {
        return creature.mainInventory.allEquipment$()
            .pipe(
                map(items =>
                    items
                        .filter(item =>
                            item.invested
                            && item.traits.includes('Invested'),
                        ),
                ),
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
        const isEquippedAtBeginning = item.equipped;

        const canEquip = (): boolean => (
            !inventory.itemId &&
            (
                item.name === 'Unarmored' ||
                (creature.isAnimalCompanion() === item.traits.includes('Companion'))
            ) && (
                creature.isFamiliar() === !(item.isArmor() || item.isWeapon() || item.isShield())
            )
        );

        item.equipped = equip && canEquip();

        if (!isEquippedAtBeginning && item.equipped) {
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
        item.invested = invest;

        //Items are automatically equipped if they are invested.
        if (item.invested) {
            this._psp.inventoryItemProcessingService?.processInvestingItem(creature, inventory, item);
        } else {
            this._psp.inventoryItemProcessingService?.processUninvestingItem(creature, item);
        }
    }

}
