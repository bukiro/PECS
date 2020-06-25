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
    public endEffects: EffectGain[] = [];
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
    public traits: string[] = [];
    //List choices you can make for this condition.
    public choices: string[] = [];
    //This property is only used to select a choice before adding the condition. It is not read when evaluating the condition.
    public choice: string = "";
}