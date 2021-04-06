import { Effect } from './Effect';
import { Hint } from './Hint';

export class Specialization {
    public desc: string = "";
    public effects: Effect[] = [];
    public hints: Hint[] = [];
    public name: string = "";
    public type: string = "";
}
