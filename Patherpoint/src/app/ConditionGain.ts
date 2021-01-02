import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';
import { v1 as uuidv1 } from 'uuid';

export class ConditionGain {
    public readonly _className: string = this.constructor.name;
    public addValue: number = 0;
    public id = uuidv1();
    public apply: boolean = true;
    public decreasingValue: boolean = false;
    //duration in turns * 10 or -1 for permanent
    public duration: number = -1;
    //nextStage in turns * 10
    public nextStage: number = -1;
    public onset: boolean = false;
    public name: string = "";
    public showChoices: boolean = false;
    public showNotes: boolean = false;
    public showVariables: boolean = false;
    public notes: string = "";
    public source: string = "";
    public value: number = 0;
    //Only activate this condition if this string evaluates to a numeral nonzero value. This is tested at the add_condition stage, so it can be combined with conditionChoiceFilter.
    public activationPrerequisite: string = "";
    //For conditions within conditions, activate this dependent on the original condition's choice.
    public conditionChoiceFilter: string = "";
    //Spells choose from multiple conditions those that match their level.
    //For example, if a spell has a ConditionGain with heightenedFilter 1 and one with heightenedFilter 2, and the spell is cast at 2nd level, only the heightenedFilter 2 ConditionGain is used.
    public heightenedFilter: number = 0;
    //When casting a spell, the spell level is inserted here so it can be used for calculations.
    public heightened: number = 0;
    //When casting a spell, some conditions want to calculate the spellcasting modifier, so we insert the spellcasting ability.
    public spellCastingAbility: string = "";
    //A condition's gainActivities gets copied here to track.
    public gainActivities: ActivityGain[] = [];
    //A condition's gainItems gets copied here to track.
    public gainItems: ItemGain[] = [];
    //If the gain is persistent, it does not get removed when its source is deactivated.
    public persistent: boolean = false;
    //For spells, designate if the condition is meant for the caster or "" for the normal target creature.
    public targetFilter: string = "";
    //Some conditions have a choice that you can make. That is stored in this value.
    public choice: string = "";
    //If choiceLocked is true, the choice can't be changed manually.
    public choiceLocked: boolean = false;
    //If acknowledgedInputRequired is true, the inputRequired message is not shown.
    public acknowledgedInputRequired: boolean = false;
}