import { Armor } from './Armor';
import { Consumable } from './Consumable';
import { Equipment } from './Equipment';
import { Item } from './Item';
import { Shield } from './Shield';
import { Wand } from './Wand';
import { Weapon } from './Weapon';
import { WornItem } from './WornItem';

export interface ItemRoles {
    item: Item;
    asConsumable: Consumable;
    asEquipment: Equipment;
    asGenericConsumable: Consumable;
    asDrinkableConsumable: Consumable;
    asImmediateStoredSpellItem: Item;
    asArmor: Armor;
    asWeapon: Weapon;
    asWand: Wand;
    asWornItem: WornItem;
    asShield: Shield;
    asMaterialChangeable: Armor | Shield | Weapon;
    asRuneChangeable: Armor | Weapon | WornItem;
    asStatusChangeable: Equipment;
    asStackable: Item;
    asTalismanChangeable: Armor | Shield | Weapon | WornItem;
    asEmblazonArmamentChangeable: Shield | Weapon;
    hasEmblazonArmament: boolean;
    hasEmblazonAntimagic: boolean;
    emblazonEnergyChoice: string;
    stack: number;
}
