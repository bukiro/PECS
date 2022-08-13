import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { EquipmentConditionsService } from 'src/libs/shared/effects-generation/services/equipment-conditions/equipment-conditions.service';
import { ShieldPropertiesService } from 'src/libs/shared/services/shield-properties/shield-properties.service';

@Injectable({
    providedIn: 'root',
})
export class EffectsGenerationPreflightService {

    constructor(
        private readonly _equipmentConditionsService: EquipmentConditionsService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _shieldPropertiesService: ShieldPropertiesService,
    ) { }

    public runEffectGenerationPreflightUpdates(creature: Creature): void {
        // Add or remove conditions depending on your equipment.
        // This is called here to ensure that the conditions exist before their effects are generated.
        this._equipmentConditionsService.generateBulkConditions(creature);
        this._equipmentConditionsService.generateItemGrantedConditions(creature);
        //Update item modifiers that influence their effectiveness and effects.
        this._updateItemModifiers(creature);
    }

    private _updateItemModifiers(creature: Creature): void {
        // Update modifiers on all armors, shields and weapons that may influence the effects they generate.
        // We update weapons even though they don't generate effects with these modifiers,
        // because this is a good spot to keep them up to date.
        creature.inventories.forEach(inv => {
            inv.shields.forEach(shield => {
                this._shieldPropertiesService.updateModifiers(shield, creature);
            });
            inv.weapons.forEach(weapon => {
                this._weaponPropertiesService.updateModifiers(weapon, creature);
            });
            inv.armors.forEach(armor => {
                this._armorPropertiesService.updateModifiers(armor, creature);
            });
        });
    }

}
