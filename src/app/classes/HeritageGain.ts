export class HeritageGain {
    public ancestry = '';
    public source = '';

    public recast(): HeritageGain {
        return this;
    }

    public clone(): HeritageGain {
        return Object.assign<HeritageGain, HeritageGain>(new HeritageGain(), JSON.parse(JSON.stringify(this))).recast();
    }
}
