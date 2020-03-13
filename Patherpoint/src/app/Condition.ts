import { ConditionGain } from './ConditionGain';

export class Condition {
    public name: string = "";
    public buff: boolean = false;
    public level: number = 0;
    public desc: string = "";
    public showon: string = "";
    public onceEffects: any[] = [];
    public effects: any[] = [];
    public specialEffects: any[] = [];
    public gainConditions: ConditionGain[] = [];
    public overrideConditions: string[] = [];
    public source: string = "";
}