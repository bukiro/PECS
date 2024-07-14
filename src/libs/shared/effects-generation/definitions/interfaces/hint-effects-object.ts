import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Hint } from 'src/app/classes/hints/hint';
import { Item } from 'src/app/classes/items/item';
import { Material } from 'src/app/classes/items/material';

export interface HintEffectsObject {
    readonly hint: Hint;
    readonly parentItem?: Item | Material;
    readonly parentConditionGain?: ConditionGain;
    readonly objectName: string;
}
