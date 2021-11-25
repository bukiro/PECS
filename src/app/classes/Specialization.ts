import { Effect } from 'src/app/classes/Effect';
import { Hint } from 'src/app/classes/Hint';

export class Specialization {
    public desc: string = "";
    public effects: Effect[] = [];
    public hints: Hint[] = [];
    public name: string = "";
    public type: string = "";
    recast() {
        this.effects = this.effects.map(obj => Object.assign(new Effect(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        return this;
    }
}
