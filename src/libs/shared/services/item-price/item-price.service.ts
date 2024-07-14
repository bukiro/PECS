import { Injectable } from '@angular/core';
import { Armor } from 'src/app/classes/items/armor';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { ItemsDataService } from '../data/items-data.service';

@Injectable({
    providedIn: 'root',
})
export class ItemPriceService {

    constructor(
        private readonly _itemsDataService: ItemsDataService,
    ) { }

    public effectiveItemPrice(item: Item): number {
        if (item.isEquipment()) {
            if (item.isArmor()) {
                return this._effectiveArmorPrice(item);
            }

            if (item.isWeapon()) {
                return this._effectiveWeaponPrice(item);
            }

            if (item.isWornItem()) {
                return this._effectiveWornItemPrice(item);
            }

            return this._effectiveEquipmentPrice(item);
        }

        return item.price;
    }

    private _effectiveEquipmentPrice(equipment: Equipment): number {
        let price = equipment.price;

        if (equipment.moddable) {
            equipment.propertyRunes.forEach(rune => {
                if (rune) {
                    // Due to orichalcum's temporal properties,
                    // etching the speed weapon property rune onto an orichalcum weapon costs half the normal Price.
                    const half = .5;

                    if (rune.name === 'Speed' && equipment.material.some(mat => mat.name.includes('Orichalcum'))) {
                        price += Math.floor(rune.price * half);
                    } else {
                        price += rune.price;
                    }
                }
            });

            equipment.propertyRunes.forEach(rune => {
                price += rune.price;
            });

            equipment.material.forEach(mat => {
                price += mat.price;

                if (parseInt(equipment.bulk, 10)) {
                    price += (mat.bulkPrice * parseInt(equipment.bulk, 10));
                }

            });
        }

        price += equipment.talismans.reduce((prev, next) => prev + next.price, 0);

        return price;
    }

    private _effectiveArmorPrice(armor: Armor): number {
        let price = this._effectiveEquipmentPrice(armor);

        if (armor.moddable) {
            if (armor.potencyRune) {
                price += this._itemsDataService.cleanItems().armorrunes.find(rune => rune.potency === armor.potencyRune)?.price || 0;
            }

            if (armor.resilientRune) {
                price += this._itemsDataService.cleanItems().armorrunes.find(rune => rune.resilient === armor.resilientRune)?.price || 0;
            }
        }

        return price;
    }

    private _effectiveWeaponPrice(weapon: Weapon | WornItem): number {
        let price = this._effectiveEquipmentPrice(weapon);

        if (weapon.moddable) {
            if (weapon.potencyRune) {
                price += this._itemsDataService.cleanItems().weaponrunes.find(rune => rune.potency === weapon.potencyRune)?.price || 0;
            }

            if (weapon.strikingRune) {
                price += this._itemsDataService.cleanItems().weaponrunes.find(rune => rune.striking === weapon.strikingRune)?.price || 0;
            }
        }

        return price;
    }

    private _effectiveWornItemPrice(wornItem: WornItem): number {
        //Worn Items can have weapon runes, so we can add up the weapon price first.
        let price = this._effectiveWeaponPrice(wornItem);

        price += wornItem.aeonStones.reduce((prev, next) => prev + next.price, 0);
        price += wornItem.talismans.reduce((prev, next) => prev + next.price, 0);

        return price;
    }

}
