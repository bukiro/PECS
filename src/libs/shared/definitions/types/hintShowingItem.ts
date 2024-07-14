import { ArmorRune } from 'src/app/classes/items/armor-rune';
import { Equipment } from 'src/app/classes/items/equipment';
import { Material } from 'src/app/classes/items/material';
import { Oil } from 'src/app/classes/items/oil';
import { Shield } from 'src/app/classes/items/shield';
import { WeaponRune } from 'src/app/classes/items/weapon-rune';
import { WornItem } from 'src/app/classes/items/worn-item';

export type HintShowingItem = Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material | Shield;
