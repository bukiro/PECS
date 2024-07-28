/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Armor } from 'src/app/classes/items/armor';
import { Weapon } from 'src/app/classes/items/weapon';
import { CreatureEquipmentService } from '../creature-equipment/creature-equipment.service';
import { InventoryService } from '../inventory/inventory.service';
import { RecastService } from '../recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class BasicEquipmentService {

    private _basicItems: { weapon: Weapon; armor: Armor } = { weapon: new Weapon(), armor: new Armor() };

    constructor(
        private readonly _inventoryService: InventoryService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _recastService: RecastService,
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
            const isInventoryTouchedBefore = creature.mainInventory.touched;

            if (!creature.mainInventory.weapons.some(weapon => !weapon.broken) && (creature.isCharacter())) {
                this._inventoryService.grantInventoryItem(
                    this._basicItems.weapon,
                    { creature, inventory: creature.mainInventory },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.mainInventory.armors.some(armor => !armor.broken)) {
                this._inventoryService.grantInventoryItem(
                    this._basicItems.armor,
                    { creature, inventory: creature.mainInventory },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.mainInventory.weapons.some(weapon => weapon.equipped === true)) {
                const firstAvailableWeapon = creature.mainInventory.weapons.find(weapon => !weapon.broken);

                if (firstAvailableWeapon) {
                    this._creatureEquipmentService.equipItem(
                        creature,
                        creature.mainInventory,
                        firstAvailableWeapon,
                        true,
                        changeAfter,
                    );
                }

            }

            if (!creature.mainInventory.armors.some(armor => armor.equipped === true)) {
                const firstAvailableArmor = creature.mainInventory.armors.find(armor => !armor.broken);

                if (firstAvailableArmor) {
                    this._creatureEquipmentService.equipItem(
                        creature,
                        creature.mainInventory,
                        firstAvailableArmor,
                        true,
                        changeAfter,
                    );
                }
            }

            creature.mainInventory.touched = isInventoryTouchedBefore;
        }
    }

    public setBasicItems(weapon: Weapon, armor: Armor): void {
        const newBasicWeapon: Weapon = weapon.clone(RecastService.recastFns);
        const newBasicArmor: Armor = armor.clone(RecastService.recastFns);

        this._basicItems = { weapon: newBasicWeapon, armor: newBasicArmor };
    }

}
