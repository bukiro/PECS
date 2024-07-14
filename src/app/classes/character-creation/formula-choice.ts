import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';

export class FormulaChoice implements Serializable<FormulaChoice> {
    //FormulaChoice is going to become relevant with the Alchemist.
    public static from(_values: DeepPartial<FormulaChoice>): FormulaChoice {
        return new FormulaChoice().with(_values);
    }

    public with(_values: DeepPartial<FormulaChoice>): FormulaChoice {
        return this;
    }

    public forExport(): DeepPartial<FormulaChoice> {
        return {};
    }

    public clone(): FormulaChoice {
        return FormulaChoice.from(this);
    }

    public isEqual(compared: Partial<FormulaChoice>, _options?: { withoutId?: boolean }): boolean {
        return this === compared;
    }
}
