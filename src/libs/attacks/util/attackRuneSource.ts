import { Observable, combineLatest, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { Weapon } from 'src/app/classes/Weapon';
import { WornItem } from 'src/app/classes/WornItem';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { isEqualArray, isEqualSerializable, isEqualSerializableArray } from 'src/libs/shared/util/compare-utils';

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
export const attackRuneSource$ = (weapon: Weapon, creature: Creature, range: string): Observable<RuneSourceSet> =>
    creature.inventories[0].activeWornItems$
        .pipe(
            distinctUntilChanged(isEqualSerializableArray),
            switchMap(activeWornItems => {
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

                    return combineLatest([
                        combineLatest(
                            activeWornItems
                                .filter(item => item.isDoublingRings)
                                .map(item =>
                                    item.data.values$
                                        .pipe(
                                            map(data => ({ item, data })),
                                        ),
                                ),
                        )
                            .pipe(
                                distinctUntilChanged(
                                    isEqualArray((a, b) =>
                                        JSON.parse(JSON.stringify(a.data)) === JSON.parse(JSON.stringify(b.data))
                                        && isEqualSerializable(a.item, b.item),
                                    ),
                                ),
                            ),
                        creature.inventories[0].equippedWeapons$
                            .pipe(
                                distinctUntilChanged(isEqualSerializableArray),
                            ),
                    ])
                        .pipe(
                            map(([doublingRingsDataSets, equippedWeapons]) => {
                                const matchingDataSet =
                                    doublingRingsDataSets
                                        .find(dataSet => dataSet.data[ironRingIndex].value === weapon.id);

                                if (matchingDataSet?.data[goldRingIndex].value) {
                                    const goldItem =
                                        equippedWeapons
                                            .find(inventoryWeapon => inventoryWeapon.id === matchingDataSet.data[goldRingIndex].value);

                                    if (goldItem) {
                                        const shouldTransferPropertyRunes =
                                            matchingDataSet.item.isDoublingRings === 'Doubling Rings (Greater)'
                                            && matchingDataSet.data[propertyRunesIndex].value === true;

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
                            }),
                        );
                }

                return of(runeSource);
            }),
        );
