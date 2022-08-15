export class SenseGain {
    public name = '';
    public excluding = false;
    public conditionChoiceFilter: Array<string> = [];

    public recast(): SenseGain {
        return this;
    }

    public clone(): SenseGain {
        return Object.assign<SenseGain, SenseGain>(new SenseGain(), JSON.parse(JSON.stringify(this))).recast();
    }
}
