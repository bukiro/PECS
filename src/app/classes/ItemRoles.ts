import { Ammunition } from './Ammunition';
import { Armor } from './Armor';
import { Consumable } from './Consumable';
import { Equipment } from './Equipment';
import { Item } from './Item';
import { Oil } from './Oil';
import { Rune } from './Rune';
import { Shield } from './Shield';
import { Talisman } from './Talisman';
import { Wand } from './Wand';
import { Weapon } from './Weapon';
import { WornItem } from './WornItem';

export interface ItemRoles {
    item: Item;
    asConsumable?: Consumable;
    asEquipment?: Equipment;
    asGenericConsumable?: Consumable;
    asDrinkableConsumable?: Consumable;
    asImmediateStoredSpellItem?: Item;
    asActivityBearing?: Equipment | Rune | Ammunition;
    asArmor?: Armor;
    asOil?: Oil;
    asTalisman?: Talisman;
    asWeapon?: Weapon;
    asWand?: Wand;
    asWornItem?: WornItem;
    asShield?: Shield;
    asMaterialChangeable?: Armor | Shield | Weapon;
    asRuneChangeable?: Armor | Weapon | WornItem;
    asStatusChangeable?: Equipment;
    asStackable?: Item;
    asTalismanChangeable?: Armor | Shield | Weapon | WornItem;
    asEmblazonArmamentChangeable?: Shield | Weapon;
    hasEmblazonArmament?: boolean;
    hasEmblazonAntimagic?: boolean;
    emblazonEnergyChoice?: string;
    stack?: number;
}
