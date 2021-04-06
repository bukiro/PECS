import { EffectGain } from './EffectGain';

export class Hint {
    //We want the active hints to be reset when loading characters. Everything listed in neversave gets deleted during saving.
    public readonly neversave: string[] = [
        "active",
        "active2",
        "active3",
        "active4",
        "active5"
    ];
    public desc: string = "";
    public showon: string = "";
    public effects: EffectGain[] = [];
    public active: boolean = false;
    public active2: boolean = false;
    public active3: boolean = false;
    public active4: boolean = false;
    public active5: boolean = false;
    //If extraActivations is 1 through 4, one or two more activation boxes are shown.
    public extraActivations: number = 0;
}
