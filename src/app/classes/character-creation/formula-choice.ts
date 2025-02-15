import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';

export class FormulaChoice implements Serializable<FormulaChoice> {
    //FormulaChoice is going to become relevant with the Alchemist.
    public static from(values: MaybeSerialized<FormulaChoice>): FormulaChoice {
        return new FormulaChoice().with(values);
    }

    public with(_values: MaybeSerialized<FormulaChoice>): FormulaChoice {
        return this;
    }

    public forExport(): Serialized<FormulaChoice> {
        return {};
    }

    public clone(): FormulaChoice {
        return FormulaChoice.from(this);
    }

    public isEqual(compared: Partial<FormulaChoice>, _options?: { withoutId?: boolean }): boolean {
        return this === compared;
    }
}
