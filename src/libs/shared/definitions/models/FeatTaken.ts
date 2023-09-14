import { v4 as uuidv4 } from 'uuid';
import { DeepPartial } from '../types/deepPartial';
import { setupSerialization } from '../../util/serialization';
import { Serializable } from '../interfaces/serializable';

const { assign, forExport } = setupSerialization<FeatTaken>({
    primitives: [
        'automatic',
        'name',
        'countAsFeat',
        'id',
        'locked',
        'source',
        'sourceId',
    ],
});

export class FeatTaken implements Serializable<FeatTaken> {
    public automatic = false;
    public name = '';
    public countAsFeat = '';
    public id = uuidv4();
    public locked = false;
    public source = '';
    public sourceId = '';

    public static from(values: DeepPartial<FeatTaken>): FeatTaken {
        return new FeatTaken().with(values);
    }

    public with(values: DeepPartial<FeatTaken>): FeatTaken {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<FeatTaken> {
        return {
            ...forExport(this),
        };
    }

    public clone(): FeatTaken {
        return FeatTaken.from(this);
    }

    public isFeature(className: string): boolean {
        //A feat is usually a feature if its source is your class or a dedication.
        return (this.source === className) || (this.locked && this.source.includes(' Dedication'));
    }
}
