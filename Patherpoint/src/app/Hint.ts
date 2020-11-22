import { EffectGain } from './EffectGain';

export class Hint {
    public readonly neversave: string[] = [
        "active"
    ];
    public desc: string = "";
    public showon: string = "";
    public effects: EffectGain[] = [];
    public active: boolean = false;
}
