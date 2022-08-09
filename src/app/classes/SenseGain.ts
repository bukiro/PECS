export class SenseGain {
    public name = '';
    public excluding = false;
    public conditionChoiceFilter: Array<string> = [];

    public recast(): SenseGain {
        return this;
    }
}
