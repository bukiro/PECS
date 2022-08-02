import { Hint } from 'src/app/classes/Hint';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Equipment } from 'src/app/classes/Equipment';
import { Material } from 'src/app/classes/Material';
import { Oil } from 'src/app/classes/Oil';
import { Rune } from 'src/app/classes/Rune';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';

export interface HintEffectsObject {
    readonly hint: Hint;
    readonly parentItem?: Equipment | Oil | WornItem | Rune | WeaponRune | Material;
    readonly parentConditionGain?: ConditionGain;
    readonly objectName: string;
}
