import { Ammunition } from './ammunition';
import { Armor } from './armor';
import { Consumable } from './consumable';
import { Equipment } from './equipment';
import { Item } from './item';
import { Oil } from './oil';
import { Rune } from './rune';
import { Scroll } from './scroll';
import { Shield } from './shield';
import { Talisman } from './talisman';
import { Wand } from './wand';
import { Weapon } from './weapon';
import { WornItem } from './worn-item';


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
    asScroll?: Scroll;
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
