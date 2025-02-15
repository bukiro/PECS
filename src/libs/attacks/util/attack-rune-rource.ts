import { computed, Signal } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weapon-proficiencies';

export interface RuneSourceSet {
    forFundamentalRunes: Weapon | WornItem;
    forPropertyRunes: Weapon | WornItem;
    reason?: Weapon | WornItem;
}

/**
 * Determines the item whose runes should be applied when calculating attack bonus or damage with the given weapon.
 * Fundamental runes and property runes can come from different items,
 * and the item that causes the change will be noted as the reason.
 *
 * @param weapon
 * @param creature
 * @param range
 * @returns
 */
export const attackRuneSource$$ = (weapon: Weapon, creature: Creature, range: string): Signal<RuneSourceSet> =>
    computed(() => {
        const activeWornItems = creature.mainInventory$$().activeWornItems$$();

        let runeSource: RuneSourceSet = { forFundamentalRunes: weapon, forPropertyRunes: weapon };

        if (weapon.prof === WeaponProficiencies.Unarmed) {
            //For unarmed attacks, return Handwraps of Mighty Blows if invested.
            const handwraps = activeWornItems.find(wornItem => wornItem.isHandwrapsOfMightyBlows);

            if (handwraps) {
                runeSource = { forFundamentalRunes: handwraps, forPropertyRunes: handwraps, reason: handwraps };
            }
        }

        //Apply doubling rings if this weapon is in the iron ring's hand, and there is a weapon in the gold ring's hand.
        if (range === 'melee') {
            const goldRingIndex = 0;
            const ironRingIndex = 1;
            const propertyRunesIndex = 2;

            const doublingRingsDataSets = activeWornItems
                .filter(item => item.isDoublingRings)
                .map(item => ({
                    item,
                    data: item.data(),
                }));

            const equippedWeapons =
                creature.mainInventory$$().equippedWeapons$$();

            const matchingDataSet =
                doublingRingsDataSets
                    .find(dataSet => dataSet.data[ironRingIndex]?.value === weapon.id);

            if (matchingDataSet?.data[goldRingIndex]?.value) {
                const goldItem =
                    equippedWeapons
                        .find(inventoryWeapon => inventoryWeapon.id === matchingDataSet.data[goldRingIndex]?.value);

                if (goldItem) {
                    const shouldTransferPropertyRunes =
                        matchingDataSet.item.isDoublingRings === 'Doubling Rings (Greater)'
                        && matchingDataSet.data[propertyRunesIndex]?.value === true;

                    return {
                        forFundamentalRunes: goldItem,
                        forPropertyRunes:
                            shouldTransferPropertyRunes
                                ? goldItem
                                : weapon,
                        reason: matchingDataSet.item,
                    };
                }
            }

            return runeSource;
        }

        return runeSource;
    });
