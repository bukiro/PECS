import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { ArmorPropertiesService } from '../armor-properties/armor-properties.service';
import { WeaponPropertiesService } from '../weapon-properties/weapon-properties.service';

@Injectable({
    providedIn: 'root',
})
export class EquipmentPropertiesService {

    constructor(
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
    ) { }

    public effectiveProficiency(
        item: Equipment,
        context: { creature: Creature; charLevel?: number },
    ): string {
        if (item.isArmor()) {
            return this._armorPropertiesService.effectiveProficiency(item, context);
        }

        if (item.isWeapon()) {
            return this._weaponPropertiesService.effectiveProficiency(item, context);
        }

        return '';
    }

}
