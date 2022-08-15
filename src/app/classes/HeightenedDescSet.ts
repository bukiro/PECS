import { HeightenedDesc } from './HeightenedDesc';

export class HeightenedDescSet {
    public level = 0;
    public descs: Array<HeightenedDesc> = [];

    public recast(): HeightenedDescSet {
        return this;
    }

    public clone(): HeightenedDescSet {
        return Object.assign<HeightenedDescSet, HeightenedDescSet>(new HeightenedDescSet(), JSON.parse(JSON.stringify(this))).recast();
    }
}
