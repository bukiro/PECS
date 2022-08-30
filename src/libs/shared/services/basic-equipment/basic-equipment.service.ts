import { Injectable } from '@angular/core';
import { Armor } from 'src/app/classes/Armor';
import { Creature } from 'src/app/classes/Creature';
import { Weapon } from 'src/app/classes/Weapon';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { CreatureEquipmentService } from '../creature-equipment/creature-equipment.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable({
    providedIn: 'root',
})
export class BasicEquipmentService {

    private _basicItems: { weapon: Weapon; armor: Armor } = { weapon: new Weapon(), armor: new Armor() };

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _inventoryService: InventoryService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
    ) { }

    public get fist(): Weapon {
        return this._basicItems.weapon;
    }

    public get unarmored(): Armor {
        return this._basicItems.armor;
    }

    public equipBasicItems(creature: Creature, changeAfter = true): void {
        if (this._basicItems.weapon && this._basicItems.armor && !(creature.isFamiliar())) {
            // A creature should start with the basic items. Granting them shouldn't count as touching the inventory,
            // So we save its touched state and revert it afterwards.
            const isInventoryTouchedBefore = creature.inventories[0].touched;

            if (!creature.inventories[0].weapons.some(weapon => !weapon.broken) && (creature.isCharacter())) {
                this._inventoryService.grantInventoryItem(
                    this._basicItems.weapon,
                    { creature, inventory: creature.inventories[0] },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.inventories[0].armors.some(armor => !armor.broken)) {
                this._inventoryService.grantInventoryItem(
                    this._basicItems.armor,
                    { creature, inventory: creature.inventories[0] },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.inventories[0].weapons.some(weapon => weapon.equipped === true)) {
                const firstAvailableWeapon = creature.inventories[0].weapons.find(weapon => !weapon.broken);

                if (firstAvailableWeapon) {
                    this._creatureEquipmentService.equipItem(
                        creature,
                        creature.inventories[0],
                        firstAvailableWeapon,
                        true,
                        changeAfter,
                    );
                }

            }

            if (!creature.inventories[0].armors.some(armor => armor.equipped === true)) {
                const firstAvailableArmor = creature.inventories[0].armors.find(armor => !armor.broken);

                if (firstAvailableArmor) {
                    this._creatureEquipmentService.equipItem(
                        creature,
                        creature.inventories[0],
                        firstAvailableArmor,
                        true,
                        changeAfter,
                    );
                }
            }

            creature.inventories[0].touched = isInventoryTouchedBefore;
        }
    }

    public setBasicItems(weapon: Weapon, armor: Armor): void {
        const newBasicWeapon: Weapon =
            Object.assign(
                new Weapon(),
                weapon,
            ).recast(this._itemsDataService.restoreItem);
        const newBasicArmor: Armor =
            Object.assign(
                new Armor(),
                armor,
            ).recast(this._itemsDataService.restoreItem);

        this._basicItems = { weapon: newBasicWeapon, armor: newBasicArmor };
    }

}
