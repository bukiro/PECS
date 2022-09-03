import { Hint } from 'src/app/classes/Hint';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';

export interface HintEffectsObject {
    readonly hint: Hint;
    readonly parentItem?: Item | Material;
    readonly parentConditionGain?: ConditionGain;
    readonly objectName: string;
}
