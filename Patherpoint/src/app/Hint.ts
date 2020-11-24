import { EffectGain } from './EffectGain';

export class Hint {
    public readonly neversave: string[] = [
        "active",
        "active2",
        "active3"
    ];
    public desc: string = "";
    public showon: string = "";
    public effects: EffectGain[] = [];
    public active: boolean = false;
    public active2: boolean = false;
    public active3: boolean = false;
    //If extraActivations is 1 or 2, 1 or two more activation boxes are shown.
    public extraActivations: number = 0;
}
