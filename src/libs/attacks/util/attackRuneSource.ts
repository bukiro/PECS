import { Creature } from 'src/app/classes/Creature';
import { Weapon } from 'src/app/classes/Weapon';
import { WornItem } from 'src/app/classes/WornItem';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';

interface RuneSourceSet {
    fundamentalRunes: Weapon | WornItem;
    propertyRunes: Weapon | WornItem;
    reason?: Weapon | WornItem;
}

export const attackRuneSource = (weapon: Weapon, creature: Creature, range: string): RuneSourceSet => {
    // Under certain circumstances, other items' runes are applied when calculating attack bonus or damage.
    // Fundamental runes and property runes can come from different items,
    // and the item that causes the change will be noted as the reason.
    let runeSource: RuneSourceSet = { fundamentalRunes: weapon, propertyRunes: weapon };

    //For unarmed attacks, return Handwraps of Mighty Blows if invested.
    if (weapon.prof === WeaponProficiencies.Unarmed) {
        const handwraps = creature.inventories[0].wornitems.find(item => item.isHandwrapsOfMightyBlows && item.investedOrEquipped());

        if (handwraps) {
            runeSource = { fundamentalRunes: handwraps, propertyRunes: handwraps, reason: handwraps };
        }
    }

    //Apply doubling rings to return a different item's runes if needed.
    if (range === 'melee') {
        const goldRingIndex = 0;
        const ironRingIndex = 1;
        const propertyRunesIndex = 2;
        const doublingRings =
            creature.inventories[0].wornitems
                .find(item => item.isDoublingRings && item.data[ironRingIndex].value === weapon.id && item.investedOrEquipped());

        if (doublingRings) {
            if (doublingRings.data[goldRingIndex].value) {
                const goldItem =
                    creature.inventories[0].weapons
                        .find(inventoryWeapon => inventoryWeapon.id === doublingRings.data[goldRingIndex].value);

                if (goldItem?.investedOrEquipped()) {
                    if (doublingRings.isDoublingRings === 'Doubling Rings (Greater)' && doublingRings.data[propertyRunesIndex]) {
                        runeSource = { fundamentalRunes: goldItem, propertyRunes: goldItem, reason: doublingRings };
                    } else {
                        runeSource = { fundamentalRunes: goldItem, propertyRunes: weapon, reason: doublingRings };
                    }
                }
            }
        }
    }

    return runeSource;
};
