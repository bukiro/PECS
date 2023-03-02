import { Injectable } from '@angular/core';
import { Armor } from 'src/app/classes/Armor';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { Rune } from 'src/app/classes/Rune';
import { Specialization } from 'src/app/classes/Specialization';
import { WornItem } from 'src/app/classes/WornItem';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { HintEffectsObject } from '../../definitions/interfaces/HintEffectsObject';

@Injectable({
    providedIn: 'root',
})
export class ItemEffectsGenerationService {

    constructor(
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
    ) { }

    public collectEffectItems(
        creature: Creature,
    ): { objects: Array<Equipment | Specialization | Rune>; hintSets: Array<HintEffectsObject> } {
        //Collect items and item specializations that may have effects, and their hints, and return them in two lists.

        let objects: Array<Equipment | Specialization | Rune> = [];
        let hintSets: Array<HintEffectsObject> = [];

        const doItemEffectsApply = (item: Equipment): boolean => (
            item.investedOrEquipped() &&
            !!item.amount &&
            !item.broken
        );

        creature.inventories.forEach(inventory => {
            inventory.allEquipment().filter(item =>
                doItemEffectsApply(item),
            )
                .forEach((item: Equipment) => {
                    objects = objects.concat(this._effectsGenerationObjects(item, { creature }));
                    hintSets = hintSets.concat(item.effectsGenerationHints());
                });
        });

        //If too many wayfinders are invested with slotted aeon stones, all aeon stone effects are ignored.
        if (creature.isCharacter() && creature.hasTooManySlottedAeonStones()) {
            objects = objects.filter(object => !(object instanceof WornItem && object.isSlottedAeonStone));
            hintSets = hintSets.filter(set => !(set.parentItem && set.parentItem instanceof WornItem && set.parentItem.isSlottedAeonStone));
        }

        return { objects, hintSets };
    }

    private _effectsGenerationObjects(item: Equipment, context: { creature: Creature }): Array<Equipment | Specialization | Rune> {
        if (item.isArmor()) {
            return this._armorEffectsGenerationObjects(item, context);
        } else if (item.isWornItem()) {
            return this._wornItemEffectsGenerationObjects(item);
        } else {
            return [item];
        }
    }

    private _armorEffectsGenerationObjects(armor: Armor, context: { creature: Creature }): Array<Equipment | Specialization | Rune> {
        return new Array<Equipment | Specialization | Rune>()
            .concat(armor)
            .concat(...this._armorPropertiesService.armorSpecializations(armor, context.creature))
            .concat(armor.propertyRunes);
    }

    private _wornItemEffectsGenerationObjects(wornItem: WornItem): Array<Equipment> {
        return [wornItem]
            .concat(...wornItem.aeonStones);
    }

}
