import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<FormulaLearned>({
    primitives: [
        'id',
        'source',
        'snareSpecialistPrepared',
        'snareSpecialistAvailable',
    ],
});

export class FormulaLearned implements Serializable<FormulaLearned> {
    public id = '';
    public source = '';
    public snareSpecialistPrepared = 0;
    public snareSpecialistAvailable = 0;

    public static from(values: DeepPartial<FormulaLearned>): FormulaLearned {
        return new FormulaLearned().with(values);
    }

    public with(values: DeepPartial<FormulaLearned>): FormulaLearned {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<FormulaLearned> {
        return {
            ...forExport(this),
        };
    }

    public clone(): FormulaLearned {
        return FormulaLearned.from(this);
    }

    public isEqual(compared: Partial<FormulaLearned>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
