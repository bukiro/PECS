import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Equipment } from 'src/app/classes/Equipment';
import { Material } from 'src/app/classes/Material';
import { Oil } from 'src/app/classes/Oil';
import { Shield } from 'src/app/classes/Shield';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';

export type HintShowingItem = Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material | Shield;
