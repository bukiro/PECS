import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';
import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';
import { AttackRestriction } from './AttackRestriction';
import { SenseGain } from './SenseGain';
import { Hint } from './Hint';

export class Condition {
    public name: string = "";
    public type: string = "";
    public buff: boolean = false;
    public hasValue: boolean = false;
    public decreasingValue: boolean = false;
    public value: number = 0;
    public desc: string = "";
    public hints: Hint[] = [];
    public inputRequired: string = "";
    public onceEffects: EffectGain[] = [];
    public endEffects: EffectGain[] = [];
    public effects: EffectGain[] = [];
    public gainActivities: ActivityGain[] = [];
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public overrideConditions: string[] = [];
    public endConditions: string[] = [];
    //Remove this condition if not all of the neededConditions are currently active.
    public neededConditions: string[] = [];
    public attackRestrictions: AttackRestriction[] = [];
    public source: string = "";
    public senses: SenseGain[] = [];
    public nextCondition: ConditionGain = null;
    public previousCondition: ConditionGain = null;
    public nextStage: number = 0;
    public onset: boolean = false;
    public fixedDuration: number = 0;
    public persistent: boolean = false;
    public restricted: boolean = false;
    public traits: string[] = [];
    //If a condition has notes (like the HP of a summoned object), they get copied on the conditionGain.
    public notes: string = "";
    //List choices you can make for this condition.
    public choices: string[] = [];
    //This property is only used to select a choice before adding the condition. It is not read when evaluating the condition.
    public choice: string = "";
    public unlimited: boolean = false;
}