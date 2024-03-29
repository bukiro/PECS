import { Injectable } from '@angular/core';
import { Scroll } from '@angular/router';
import { AdventuringGear } from '../../../../app/classes/AdventuringGear';
import { AlchemicalElixir } from '../../../../app/classes/AlchemicalElixir';
import { Ammunition } from '../../../../app/classes/Ammunition';
import { Armor } from '../../../../app/classes/Armor';
import { ArmorRune } from '../../../../app/classes/ArmorRune';
import { Consumable } from '../../../../app/classes/Consumable';
import { Equipment } from '../../../../app/classes/Equipment';
import { Item } from '../../../../app/classes/Item';
import { ItemRoles } from '../../../../app/classes/ItemRoles';
import { Oil } from '../../../../app/classes/Oil';
import { Potion } from '../../../../app/classes/Potion';
import { Rune } from '../../../../app/classes/Rune';
import { Shield } from '../../../../app/classes/Shield';
import { Talisman } from '../../../../app/classes/Talisman';
import { Wand } from '../../../../app/classes/Wand';
import { Weapon } from '../../../../app/classes/Weapon';
import { WeaponRune } from '../../../../app/classes/WeaponRune';
import { WornItem } from '../../../../app/classes/WornItem';

@Injectable({
    providedIn: 'root',
})
export class ItemRolesService {

    public getItemRoles(item: Item): ItemRoles {
        const asArmor = this._itemAsArmor(item);
        const asWeapon = this._itemAsWeapon(item);

        return {
            item,
            asConsumable: this._itemAsConsumable(item),
            asGenericConsumable: this._itemAsGenericConsumable(item),
            asDrinkableConsumable: this._itemAsDrinkableConsumable(item),
            asImmediateStoredSpellItem: this._itemAsImmediateStoredSpellItem(item),
            asActivityBearing: this._itemAsActivityBearing(item),
            asEquipment: this._itemAsEquipment(item),
            asArmor,
            asOil: this._itemAsOil(item),
            asTalisman: this._itemAsTalisman(item),
            asWeapon,
            asWand: this._itemAsWand(item),
            asWornItem: this._itemAsWornItem(item),
            asShield: this._itemAsShield(item),
            asMaterialChangeable: this._itemAsMaterialChangeable(item),
            asRuneChangeable: this._itemAsRuneChangeable(item),
            asTalismanChangeable: this._itemAsTalismanChangeable(item),
            asStatusChangeable: this._itemAsStatusChangeable(item),
            asStackable: this._itemAsStackable(item),
            asEmblazonArmamentChangeable: this._itemAsEmblazonArmamentChangeable(item),
            hasEmblazonArmament: this._itemHasEmblazonArmament(item),
            hasEmblazonAntimagic: this._itemHasEmblazonAntimagic(item),
            emblazonEnergyChoice: this._itemEmblazonEnergyChoice(item),
            stack: this._itemStack(item),
        };
    }

    private _itemAsConsumable(item: Item): Consumable | undefined {
        return item instanceof Consumable ? item : undefined;
    }

    private _itemAsEquipment(item: Item): Equipment | undefined {
        return item instanceof Equipment ? item : undefined;
    }

    private _itemAsGenericConsumable(item: Item): Consumable | undefined {
        return (
            item instanceof Consumable &&
            !(
                item instanceof AlchemicalElixir ||
                item instanceof Potion ||
                item instanceof Scroll ||
                item instanceof Oil ||
                item instanceof Talisman
            )
        )
            ? item
            : undefined;
    }

    private _itemAsDrinkableConsumable(item: Item): Consumable | undefined {
        return (item instanceof AlchemicalElixir || item instanceof Potion) ? item : undefined;
    }

    private _itemAsImmediateStoredSpellItem(item: Item): Item | undefined {
        return (
            item.storedSpells.length &&
            !(
                item instanceof WeaponRune ||
                item instanceof ArmorRune ||
                item instanceof Oil
            )
        )
            ? item
            : undefined;
    }

    private _itemAsActivityBearing(item: Item): Equipment | Ammunition | Rune | undefined {
        return (
            item instanceof Equipment ||
            item instanceof Ammunition ||
            item instanceof Rune
        )
            ? item
            : undefined;
    }

    private _itemAsArmor(item: Item): Armor | undefined {
        return item instanceof Armor ? item : undefined;
    }

    private _itemAsOil(item: Item): Oil | undefined {
        return item instanceof Oil ? item : undefined;
    }

    private _itemAsTalisman(item: Item): Talisman | undefined {
        return item instanceof Talisman ? item : undefined;
    }

    private _itemAsWeapon(item: Item): Weapon | undefined {
        return item instanceof Weapon ? item : undefined;
    }

    private _itemAsWornItem(item: Item): WornItem | undefined {
        return item instanceof WornItem ? item : undefined;
    }

    private _itemAsShield(item: Item): Shield | undefined {
        return item instanceof Shield ? item : undefined;
    }

    private _itemAsWand(item: Item): Wand | undefined {
        return item instanceof Wand ? item : undefined;
    }

    private _itemAsMaterialChangeable(item: Item): Armor | Shield | Weapon | undefined {
        return (item instanceof Armor || item instanceof Shield || item instanceof Weapon) ? item : undefined;
    }

    private _itemAsRuneChangeable(item: Item): Armor | Weapon | WornItem | undefined {
        return (
            item instanceof Armor ||
            item instanceof Weapon ||
            (item instanceof WornItem && item.isHandwrapsOfMightyBlows)
        )
            ? item
            : undefined;
    }

    private _itemAsTalismanChangeable(item: Item): Armor | Shield | Weapon | WornItem | undefined {
        return (
            item instanceof Armor ||
            item instanceof Shield ||
            item instanceof Weapon ||
            (item instanceof WornItem && (item.isBracersOfArmor || item.isHandwrapsOfMightyBlows))
        )
            ? item
            : undefined;
    }

    private _itemAsStatusChangeable(item: Item): Equipment | undefined {
        return (item instanceof Equipment && !['Fist', 'Unarmored'].includes(item.name)) ? item : undefined;
    }

    private _itemAsStackable(item: Item): Item | undefined {
        return item.canStack() ? item : undefined;
    }

    private _itemAsEmblazonArmamentChangeable(item: Item): Shield | Weapon | undefined {
        return (item instanceof Shield || item instanceof Weapon) ? item : undefined;
    }

    private _itemHasEmblazonArmament(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type === 'emblazonArmament');
    }

    private _itemEmblazonEnergyChoice(item: Item): string | undefined {
        return (item instanceof Weapon || item instanceof Shield)
            ? item.emblazonArmament.find(ea => ea.type === 'emblazonEnergy')?.choice
            : undefined;
    }

    private _itemHasEmblazonAntimagic(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type === 'emblazonAntimagic');
    }

    private _itemStack(item: Item): number {
        return (item instanceof Consumable || item instanceof AdventuringGear) ? item.stack : 1;
    }

}
