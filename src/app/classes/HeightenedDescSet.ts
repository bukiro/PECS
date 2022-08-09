import { HeightenedDesc } from './HeightenedDesc';

export class HeightenedDescSet {
    public level = 0;
    public descs: Array<HeightenedDesc> = [];

    public recast(): HeightenedDescSet {
        return this;
    }
}
