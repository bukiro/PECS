export class SenseGain {
    public name: string = "";
    public excluding: boolean = false;
    public conditionChoiceFilter: string[] = [];
    recast() {
        return this;
    }
}
