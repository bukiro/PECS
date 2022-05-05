import { Injectable } from '@angular/core';
import { Scroll } from '@angular/router';
import { AdventuringGear } from '../classes/AdventuringGear';
import { AlchemicalElixir } from '../classes/AlchemicalElixir';
import { Armor } from '../classes/Armor';
import { ArmorRune } from '../classes/ArmorRune';
import { Consumable } from '../classes/Consumable';
import { Equipment } from '../classes/Equipment';
import { Item } from '../classes/Item';
import { ItemRoles } from '../classes/ItemRoles';
import { Oil } from '../classes/Oil';
import { Potion } from '../classes/Potion';
import { Shield } from '../classes/Shield';
import { Talisman } from '../classes/Talisman';
import { Wand } from '../classes/Wand';
import { Weapon } from '../classes/Weapon';
import { WeaponRune } from '../classes/WeaponRune';
import { WornItem } from '../classes/WornItem';

@Injectable({
    providedIn: 'root',
})
export class ItemRolesService {

    public getItemRoles(item: Item): ItemRoles {
        const asArmor = this.itemAsArmor(item);
        const asWeapon = this.itemAsWeapon(item);

        return {
            item,
            asConsumable: this.itemAsConsumable(item),
            asGenericConsumable: this.itemAsGenericConsumable(item),
            asDrinkableConsumable: this.itemAsDrinkableConsumable(item),
            asImmediateStoredSpellItem: this.itemAsImmediateStoredSpellItem(item),
            asEquipment: this.itemAsEquipment(item),
            asArmor,
            asWeapon,
            asWand: this.itemAsWand(item),
            asWornItem: this.itemAsWornItem(item),
            asShield: this.itemAsShield(item),
            asMaterialChangeable: this.itemAsMaterialChangeable(item),
            asRuneChangeable: this.itemAsRuneChangeable(item),
            asTalismanChangeable: this.itemAsTalismanChangeable(item),
            asStatusChangeable: this.itemAsStatusChangeable(item),
            asStackable: this.itemAsStackable(item),
            asEmblazonArmamentChangeable: this.itemAsEmblazonArmamentChangeable(item),
            hasEmblazonArmament: this.itemHasEmblazonArmament(item),
            hasEmblazonAntimagic: this.itemHasEmblazonAntimagic(item),
            emblazonEnergyChoice: this.itemEmblazonEnergyChoice(item),
            stack: this.itemStack(item),
        };
    }

    private itemAsConsumable(item: Item): Consumable {
        return item instanceof Consumable ? item : null;
    }

    private itemAsEquipment(item: Item): Equipment {
        return item instanceof Equipment ? item : null;
    }

    private itemAsGenericConsumable(item: Item): Consumable {
        return (item instanceof Consumable && !(item instanceof AlchemicalElixir || item instanceof Potion || item instanceof Scroll || item instanceof Oil || item instanceof Talisman)) ? item : null;
    }

    private itemAsDrinkableConsumable(item: Item): Consumable {
        return (item instanceof AlchemicalElixir || item instanceof Potion) ? item : null;
    }

    private itemAsImmediateStoredSpellItem(item: Item): Item {
        return (item.storedSpells.length && !(item instanceof WeaponRune || item instanceof ArmorRune || item instanceof Oil)) ? item : null;
    }

    private itemAsArmor(item: Item): Armor {
        return item instanceof Armor ? item : null;
    }

    private itemAsWeapon(item: Item): Weapon {
        return item instanceof Weapon ? item : null;
    }

    private itemAsWornItem(item: Item): WornItem {
        return item instanceof WornItem ? item : null;
    }

    private itemAsShield(item: Item): Shield {
        return item instanceof Shield ? item : null;
    }

    private itemAsWand(item: Item): Wand {
        return item instanceof Wand ? item : null;
    }

    private itemAsMaterialChangeable(item: Item): Armor | Shield | Weapon {
        return (item instanceof Armor || item instanceof Shield || item instanceof Weapon) ? item : null;
    }

    private itemAsRuneChangeable(item: Item): Armor | Weapon | WornItem {
        return (item instanceof Armor || item instanceof Weapon || (item instanceof WornItem && item.isHandwrapsOfMightyBlows)) ? item : null;
    }

    private itemAsTalismanChangeable(item: Item): Armor | Shield | Weapon | WornItem {
        return (item instanceof Armor || item instanceof Shield || item instanceof Weapon || (item instanceof WornItem && item.isBracersOfArmor)) ? item : null;
    }

    private itemAsStatusChangeable(item: Item): Equipment {
        return (item instanceof Equipment && !['Fist', 'Unarmored'].includes(item.name)) ? item : null;
    }

    private itemAsStackable(item: Item): Item {
        return item.canStack() ? item : null;
    }

    private itemAsEmblazonArmamentChangeable(item: Item): Shield | Weapon {
        return (item instanceof Shield || item instanceof Weapon) ? item : null;
    }

    private itemHasEmblazonArmament(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type == 'emblazonArmament');
    }

    private itemEmblazonEnergyChoice(item: Item): string {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.find(ea => ea.type == 'emblazonEnergy')?.choice;
    }

    private itemHasEmblazonAntimagic(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type == 'emblazonAntimagic');
    }

    private itemStack(item: Item): number {
        return (item instanceof Consumable || item instanceof AdventuringGear) ? item.stack : 1;
    }

}
