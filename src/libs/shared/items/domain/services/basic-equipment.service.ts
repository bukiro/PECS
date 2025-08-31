import { inject, Injectable } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { Armor } from '../../util/models/armor';
import { Weapon } from '../../util/models/weapon';
import { InventoryService } from './inventory.service';
import { CreatureEquipmentService } from './creature-equipment.service';
import { ItemCollection } from '../../util/models/item-collection';
import { Character } from 'src/libs/shared/character/util/models/character';


@Injectable({
    providedIn: 'root',
})
export class BasicEquipmentService {

    private _basicItems: { weapon: Weapon; armor: Armor } = { weapon: new Weapon(), armor: new Armor() };

    private readonly _inventoryService = inject(InventoryService);
    private readonly _creatureEquipmentService = inject(CreatureEquipmentService);

    public get fist(): Weapon {
        return this._basicItems.weapon;
    }

    public get unarmored(): Armor {
        return this._basicItems.armor;
    }

    public equipBasicItems(creature: Creature): void {
        if (creature.isFamiliar()) {
            return;
        }

        const mainInventory = creature.mainInventory$$();

        // A creature should start with the basic items. Granting them shouldn't count as touching the inventory,
        // So we save its touched state and revert it afterwards.
        const isInventoryTouchedBefore = mainInventory.touched();

        if (creature.isCharacter()) {
            this._grantBasicWeapon(mainInventory, { creature });
        }

        this._grantBasicArmor(mainInventory, { creature });

        this._equipBasicWeapon(mainInventory, { creature });

        this._equipBasicArmor(mainInventory, { creature });

        mainInventory.touched.set(isInventoryTouchedBefore);
    }

    public setBasicItems(weapon: Weapon, armor: Armor): void {
        const newBasicWeapon = weapon.clone(RecastService.recastFns);
        const newBasicArmor = armor.clone(RecastService.recastFns);

        this._basicItems = { weapon: newBasicWeapon, armor: newBasicArmor };
    }

    private _grantBasicWeapon(inventory: ItemCollection, { creature }: { creature: Character }): void {
        if (this._basicItems.weapon) {
            return;
        }

        const hasUsableWeapon = inventory.weapons().some(weapon => !weapon.broken());

        if (!hasUsableWeapon) {
            this._inventoryService.grantInventoryItem(
                this._basicItems.weapon,
                { creature, inventory },
                { equipAfter: false },
            );
        }
    }

    private _grantBasicArmor(inventory: ItemCollection, { creature }: { creature: Creature }): void {
        if (!this._basicItems.armor) {
            return;
        }

        const hasUsableArmor = inventory.armors().some(armor => !armor.broken());

        if (!hasUsableArmor) {
            this._inventoryService.grantInventoryItem(
                this._basicItems.armor,
                { creature, inventory },
                { equipAfter: false },
            );
        }
    }

    private _equipBasicWeapon(inventory: ItemCollection, { creature }: { creature: Creature }): void {
        const hasEquippedWeapon = inventory.weapons().some(weapon => weapon.equipped());

        if (!hasEquippedWeapon) {
            const firstAvailableWeapon = inventory.weapons().find(weapon => !weapon.broken());

            if (firstAvailableWeapon) {
                this._creatureEquipmentService.equipItem(
                    creature,
                    inventory,
                    firstAvailableWeapon,
                    true,
                );
            }
        }
    }

    private _equipBasicArmor(inventory: ItemCollection, { creature }: { creature: Creature }): void {
        if (!this._basicItems.armor) {
            return;
        }

        const hasUsableArmor = inventory.armors().some(armor => armor.equipped());

        if (!hasUsableArmor) {
            const firstAvailableArmor = inventory.armors().find(armor => !armor.broken);

            if (firstAvailableArmor) {
                this._creatureEquipmentService.equipItem(
                    creature,
                    inventory,
                    firstAvailableArmor,
                    true,
                );
            }
        }
    }

}
