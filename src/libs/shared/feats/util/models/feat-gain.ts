import { v4 as uuidv4 } from 'uuid';
import { setupSerialization } from '../../../serialization/util/utils/serialization';
import { Serialized, MaybeSerialized, Serializable } from '../../../serialization/util/models/serializable';
import { Feat } from './feat';
import { signal, Signal } from '@angular/core';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

const { assign, forExport, isEqual } = setupSerialization<FeatGain>({
    primitives: [
        'automatic',
        'name',
        'id',
        'locked',
        'source',
        'sourceId',
    ],
});

export class FeatGain implements Serializable<FeatGain> {
    public automatic = false;
    public id = uuidv4();
    public locked = false;
    public source = '';
    public sourceId = '';

    public readonly name$$ = signal('');

    public readonly originalFeat$$: Signal<Feat>;

    constructor(recastFns: RecastFns) {
        this.originalFeat$$ = recastFns.getOriginalFeat$$(this);
    }

    public get name(): string {
        // The gain's name never changes during play and shouldn't be treated as if it did.
        // But for the case that a gain is cloned with a different name, the originalFeat signal needs to update.
        // As a compromise, the signal is wrapped with the setter/getter pair.
        return this.name$$();
    }

    public set name(value: string) {
        this.name$$.set(value);
    }

    public static from(values: MaybeSerialized<FeatGain>, recastFns: RecastFns): FeatGain {
        return new FeatGain(recastFns).with(values);
    }

    public with(values: MaybeSerialized<FeatGain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<FeatGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return FeatGain.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<FeatGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public isFeature(className: string): boolean {
        //A feat is usually a feature if its source is your class or a dedication.
        return (this.source === className) || (this.locked && this.source.includes(' Dedication'));
    }
}
