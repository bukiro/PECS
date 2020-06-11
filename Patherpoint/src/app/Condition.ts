import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';
import { ActivityGain } from './ActivityGain';
import { SpecializationGain } from './SpecializationGain';

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
    public nextCondition: string = "";
    public previousCondition: string = "";
    public nextStage: number = 0;
    public onset: boolean = false;
    public fixedDuration: number = 0;
    public persistent: boolean = false;
    public restricted: boolean = false;
}