import { signal } from '@angular/core';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

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
    public snareSpecialistPrepared = signal(0);
    public snareSpecialistAvailable = signal(0);

    public static from(values: MaybeSerialized<FormulaLearned>): FormulaLearned {
        return new FormulaLearned().with(values);
    }

    public with(values: MaybeSerialized<FormulaLearned>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<FormulaLearned> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return FormulaLearned.from(this) as this;
    }

    public isEqual(compared: Partial<FormulaLearned>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
