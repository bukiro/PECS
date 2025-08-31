import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { Item } from 'src/libs/shared/items/util/models/item';
import { Material } from 'src/libs/shared/items/util/models/material';

export interface HintEffectsObject {
    readonly hint: Hint;
    readonly parentItem?: Item | Material;
    readonly parentConditionGain?: ConditionGain;
    readonly objectName: string;
}
