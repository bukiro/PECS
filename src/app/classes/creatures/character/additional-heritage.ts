import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Heritage } from './heritage';

const { assign, forExport, isEqual } = setupSerialization<AdditionalHeritage>({
    primitives: [
        'source',
        'charLevelAvailable',
    ],
});

export class AdditionalHeritage extends Heritage implements Serializable<AdditionalHeritage> {
    //Some feats may add additional heritages. We use the source and level here so we can identify and remove them.
    public source = '';
    public charLevelAvailable = 0;

    public static from(values: DeepPartial<AdditionalHeritage>): AdditionalHeritage {
        return new AdditionalHeritage().with(values);
    }

    public with(values: DeepPartial<AdditionalHeritage>): AdditionalHeritage {
        super.with(values);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AdditionalHeritage> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(): AdditionalHeritage {
        return AdditionalHeritage.from(this);
    }

    public isEqual(compared: Partial<AdditionalHeritage>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }
}
