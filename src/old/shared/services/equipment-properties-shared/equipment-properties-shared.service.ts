import { computed, Injectable, Signal, signal } from '@angular/core';
import { EmblazonArmamentSet } from '../../../../libs/shared/items/util/models/emblazon-armament-set';
import { stringEqualsCaseInsensitive } from '../../../../libs/shared/common/util/utils/string-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { Shield } from 'src/libs/shared/items/util/models/shield';
import { Weapon } from 'src/libs/shared/items/util/models/weapon';

@Injectable({
    providedIn: 'root',
})
export class EquipmentPropertiesSharedService {

    // TODO: Move to creature adapter or even to the item
    public calculateEmblazonArmament(item: Weapon | Shield, creature: Creature): Signal<EmblazonArmamentSet | undefined> {
        const deities$$ = creature.isCharacter()
            ? creature.deitiesAdapter.currentDeities$$()
            : signal([]).asReadonly();

        // If the symbol is emblazoned with Emblazon Divinity, anyone can profit from it.
        // Otherwise, the character's deity must match the one of the symbol's creator.
        return computed(() => {
            const emblazonArmament = item.emblazonArmament();

            if (emblazonArmament) {
                if (emblazonArmament.emblazonDivinity) {
                    return emblazonArmament;
                }

                if (
                    deities$$().some(deity => stringEqualsCaseInsensitive(deity.name, emblazonArmament.deity))
                ) {
                    return emblazonArmament;
                }
            }

            return;
        });
    }

}
