import { ConditionGain } from './ConditionGain';

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
    public onceEffects: any[] = [];
    public effects: any[] = [];
    public specialEffects: any[] = [];
    public gainConditions: ConditionGain[] = [];
    public overrideConditions: string[] = [];
    public source: string = "";
}