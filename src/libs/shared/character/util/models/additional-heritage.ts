import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { Heritage } from './heritage';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

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

    public static from(values: MaybeSerialized<AdditionalHeritage>, recastFns: RecastFns): AdditionalHeritage {
        return new AdditionalHeritage().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AdditionalHeritage>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AdditionalHeritage> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return AdditionalHeritage.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AdditionalHeritage>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }
}
