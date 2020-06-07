import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';
import { ActivityGain } from './ActivityGain';

export class Condition {
    public name: string = "";
    public type: string = "";
    public buff: boolean = false;
    public hasValue: boolean = false;
    public decreasingValue: boolean = false;
    public value: number = 0;
    public desc: string = "";
    public showon: string = "";
    public inputRequired: string = "";
    public onceEffects: EffectGain[] = [];
    public effects: EffectGain[] = [];
    public gainConditions: ConditionGain[] = [];
    public gainActivities: ActivityGain[] = [];
    public overrideConditions: string[] = [];
    public endConditions: string[] = [];
    public attackRestrictions: string[] = [];
    public source: string = "";
    public senses: string[] = [];
}