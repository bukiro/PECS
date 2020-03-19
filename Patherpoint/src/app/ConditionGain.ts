export class ConditionGain {
    public name: string = "";
    public value: number = 0;
    public source: string = "";
    public apply: boolean = true;
    //duration is turns * 10 or -1 for permanent
    public duration: number = -1;
    public decreasingValue: boolean = false;
}
