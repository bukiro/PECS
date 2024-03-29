import { Heritage } from './Heritage';

export class AdditionalHeritage extends Heritage {
    //Some feats may add additional heritages. We use the source and level here so we can identify and remove them.
    public source = '';
    public charLevelAvailable = 0;

    public recast(): AdditionalHeritage {
        return this;
    }

    public clone(): AdditionalHeritage {
        return Object.assign<AdditionalHeritage, AdditionalHeritage>(new AdditionalHeritage(), JSON.parse(JSON.stringify(this))).recast();
    }
}
