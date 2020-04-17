import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';

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
    public overrideConditions: string[] = [];
    public attackRestrictions: string[] = [];
    public source: string = "";
}