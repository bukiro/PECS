import { Injectable } from '@angular/core';
import { Armor } from 'src/app/classes/Armor';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { Rune } from 'src/app/classes/Rune';
import { Specialization } from 'src/app/classes/Specialization';
import { WornItem } from 'src/app/classes/WornItem';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';

@Injectable({
    providedIn: 'root',
})
export class ItemEffectsGenerationService {

    constructor(
        private readonly _armorPropertiesService: ArmorPropertiesService,
    ) { }

    public effectsGenerationObjects(item: Equipment, context: { creature: Creature }): Array<Equipment | Specialization | Rune> {
        if (item.isArmor()) {
            return this._armorEffectsGenerationObjects(item, context);
        } else if (item.isWornItem()) {
            return this._wornItemEffectsGenerationObjects(item);
        } else {
            return [item];
        }
    }

    private _armorEffectsGenerationObjects(armor: Armor, context: { creature: Creature }): Array<Equipment | Specialization | Rune> {
        return ([] as Array<Equipment | Specialization | Rune>)
            .concat(armor)
            .concat(...this._armorPropertiesService.armorSpecializations(armor, context.creature))
            .concat(armor.propertyRunes);
    }

    private _wornItemEffectsGenerationObjects(wornItem: WornItem): Array<Equipment> {
        return [wornItem]
            .concat(...wornItem.aeonStones);
    }

}
