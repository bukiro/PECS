import { ConditionGain } from './ConditionGain';

export class Condition {
    public name: string = "";
    public buff: boolean = false;
    public level: number = 0;
    public desc: string = "";
    public showon: string = "";
    public effects: string[] = [];
    public specialEffects: string[] = [];
    public gainConditions: ConditionGain[] = [];
    public overrideConditions: string[] = [];
    public source: string = "";
}