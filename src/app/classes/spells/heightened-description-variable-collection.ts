import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { HeightenedDescriptionVariable } from './heightened-description-variable';

const { assign, forExport, isEqual } = setupSerialization<HeightenedDescriptionVariableCollection>({
    primitives: [
        'level',
    ],
    primitiveObjectArrays: [
        'descs',
    ],
});

export class HeightenedDescriptionVariableCollection implements Serializable<HeightenedDescriptionVariableCollection> {
    public level = 0;
    public descs: Array<HeightenedDescriptionVariable> = [];

    public static from(values: MaybeSerialized<HeightenedDescriptionVariableCollection>): HeightenedDescriptionVariableCollection {
        return new HeightenedDescriptionVariableCollection().with(values);
    }

    public with(values: MaybeSerialized<HeightenedDescriptionVariableCollection>): HeightenedDescriptionVariableCollection {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<HeightenedDescriptionVariableCollection> {
        return {
            ...forExport(this),
        };
    }

    public clone(): HeightenedDescriptionVariableCollection {
        return HeightenedDescriptionVariableCollection.from(this);
    }

    public isEqual(compared: Partial<HeightenedDescriptionVariableCollection>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
