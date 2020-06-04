import { Condition } from './Condition';

export class ConditionGain {
    public readonly _className: string = this.constructor.name;
    public addValue: number = 0;
    public apply: boolean = true;
    public decreasingValue: boolean = false;
    //duration in turns * 10 or -1 for permanent
    public duration: number = -1;
    public name: string = "";
    public source: string = "";
    public persistentDamage: string = "";
    public value: number = 0;
    //Spells choose from multiple conditions those that match their level.
    //For example, if a spell has a ConditionGain with heightenedFilter 1 and one with heightenedFilter 2, and the spell is cast at 2nd level, only the heightenedFilter 2 ConditionGain is used.
    public heightenedFilter: number = 0;
    //When casting a spell, the spell level is inserted here so it can be used for calculations.
    public heightened: number = 0;
    public customCondition: Condition = null;
}