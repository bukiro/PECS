import { Hint } from 'src/app/classes/Hint';
import { EffectGain } from './EffectGain';

export class Specialization {
    public desc = '';
    public effects: Array<EffectGain> = [];
    public hints: Array<Hint> = [];
    public name = '';
    public type = '';
    recast() {
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        return this;
    }
}
