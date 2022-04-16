import { HeightenedDesc } from './HeightenedDesc';

export class HeightenedDescSet {
    public level = 0;
    public descs: HeightenedDesc[] = [];
    recast() {
        return this;
    }
}
