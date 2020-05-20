export class ConditionGain {
    public readonly _className: string = this.constructor.name;
    public addValue: number = 0;
    public apply: boolean = true;
    public decreasingValue: boolean = false;
    //duration in turns * 10 or -1 for permanent
    public duration: number = -1;
    public name: string = "";
    public source: string = "";
    public value: number = 0;
    public heightened: number = 0;
}
