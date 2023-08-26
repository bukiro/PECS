import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from 'src/app/classes/WornItem';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { Observable, map } from 'rxjs';
import { Weapon } from 'src/app/classes/Weapon';

@Injectable({
    providedIn: 'root',
})
export class CreatureEquipmentService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public equippedCreatureArmor$(creature: Creature): Observable<Array<Armor>> {
        return creature.inventories[0].equippedArmors$;
    }

    public equippedCreatureBracersOfArmor$(creature: Creature): Observable<Array<WornItem>> {
        return creature.inventories[0].activeWornItems$
            .pipe(
                map(wornItems => wornItems.filter(wornItem => wornItem.isBracersOfArmor)),
            );
    }

    public equippedCreatureShield$(creature: Creature): Observable<Array<Shield>> {
        return creature.inventories[0].equippedShields$;
    }

    public equippedCreatureWeapons(creature: Creature): Observable<Array<Weapon>> {
        return creature.inventories[0].equippedWeapons$;
    }

    public investedCreatureEquipment$(creature: Creature): Observable<Array<Equipment>> {
        return creature.inventories[0].allEquipment$()
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

        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        this._refreshService.prepareChangesByItem(creature, item);

        if (!isEquippedAtBeginning && item.equipped) {
            this._psp.inventoryItemProcessingService?.processEquippingItem(creature, inventory, item);
        } else if (isEquippedAtBeginning && !item.equipped) {
            this._psp.inventoryItemProcessingService?.processUnequippingItem(creature, inventory, item, equipBasicItems);
        }

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }
    }

    public investItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
        invest = true,
        changeAfter = true,
    ): void {
        item.invested = invest;
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(creature.type, item.id);

        if (item.gainSpells.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
        }

        //Items are automatically equipped if they are invested.
        if (item.invested) {
            this._psp.inventoryItemProcessingService?.processInvestingItem(creature, inventory, item);
        } else {
            this._psp.inventoryItemProcessingService?.processUninvestingItem(creature, item);
        }

        // If a wayfinder is invested or uninvested, all other invested wayfinders need to run updates as well,
        // because too many invested wayfinders disable each other's aeon stones.
        if (item.isWornItem() && item.aeonStones.length) {
            creature.inventories[0].wornitems
                .filter(wornItem => wornItem.invested && wornItem !== item && wornItem.aeonStones.length)
                .forEach(wornItem => {
                    this._refreshService.prepareChangesByItem(creature, wornItem);
                });
        }

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }
    }

}
