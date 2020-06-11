import { Condition } from './Condition';
import { ActivityGain } from './ActivityGain';

export class ConditionGain {
    public readonly _className: string = this.constructor.name;
    public addValue: number = 0;
    public apply: boolean = true;
    public decreasingValue: boolean = false;
    //duration in turns * 10 or -1 for permanent
    public duration: number = -1;
    //nextStage in turns * 10
    public nextStage: number = -1;
    public onset: boolean = false;
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
    //A condition's gainActivities gets copied here to track.
    public gainActivities: ActivityGain[] = [];
    //If the gain is persistent, it does not get removed when its source is deactivated.
    public persistent: boolean = false;
}