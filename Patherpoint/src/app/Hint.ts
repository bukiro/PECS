import { EffectGain } from './EffectGain';

export class Hint {
    public desc: string = "";
    public showon: string = "";
    public effects: EffectGain[] = [];
    public active: boolean = false;
}
