import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { v4 as uuidv4 } from 'uuid';

export class ConditionGain {
    public addValue: number = 0;
    public addValueUpperLimit: number = 0;
    public addValueLowerLimit: number = 0;
    public increaseRadius: number = 0;
    public id = uuidv4();
    public foreignPlayerId: string = "";
    public apply: boolean = true;
    public paused: boolean = false;
    public decreasingValue: boolean = false;
    //Duration in turns * 10 [+1 to resolve afterwards], or:
    // - -5 for automatic - the duration will be determined by choice and level (for spells).
    // - -1 for permanent
    // - -2 for until rest
    // - -3 for until refocus
    // - 1 for until resolved - will need to be resolved and removed manually before time can pass
    // - 2 for until another character's turn - will end just like duration 5, but with a different text
    // - 0 for no duration - will be processed and then immediately removed, useful for instant effects and chaining conditions
    public duration: number = -1;
    public maxDuration: number = -1;
    //nextStage in turns * 10
    public nextStage: number = 0;
    public name: string = "";
    //On an active condition, show the choice options. Set at runtime. Not to be confused with hideChoices, where the choices are hidden in spells and activities before adding the condition.
    public showChoices: boolean = false;
    //On an active condition, show the notes. Set at runtime.
    public showNotes: boolean = false;
    //On an active condition, show the duration options. Set at runtime.
    public showDuration: boolean = false;
    //On an active condition, show the value options. Set at runtime.
    public showValue: boolean = false;
    //On an active condition, show the radius options. Set at runtime.
    public showRadius: boolean = false;
    public notes: string = "";
    public source: string = "";
    public parentID: string = "";
    public value: number = 0;
    //Only activate this condition if this string evaluates to a numeral nonzero value (so use "<evaluation> ? 1 : null"). This is tested at the add_condition stage, so it can be combined with conditionChoiceFilter.
    public activationPrerequisite: string = "";
    //For conditions within conditions, activate this condition only if this choice was made on the original condition.
    public conditionChoiceFilter: string[] = [];
    //Spells choose from multiple conditions those that match their level.
    //For example, if a spell has a ConditionGain with heightenedFilter 1 and one with heightenedFilter 2, and the spell is cast at 2nd level, only the heightenedFilter 2 ConditionGain is used.
    public heightenedFilter: number = 0;
    //Some conditions are given depending on the character's alignment. Examples can be "evil", "!evil", "lawful evil" or "!lawful evil" (but not "evil lawful" or "evil !lawful").
    public alignmentFilter: string = "";
    //When casting a spell, the spell level is inserted here so it can be used for calculations.
    public heightened: number = 0;
    //When casting a spell, a different radius for a condition may be wanted.
    public radius: number = 0;
    //When casting a spell, some conditions want to calculate the spellcasting modifier, so we copy the spellcasting ability.
    public spellCastingAbility: string = "";
    //Some conditions change depending on how the spell was cast (particularly if they were cast as an Innate spell), so we copy the spell's source.
    public spellSource: string = "";
    //Save the id of the SpellGain or ActivityGain so that the Spellgain or ActivityGain can be deactivated when the condition ends.
    public sourceGainID: string = "";
    //A condition's gainActivities gets copied here to track.
    public gainActivities: ActivityGain[] = [];
    //A condition's gainItems gets copied here to track.
    public gainItems: ItemGain[] = [];
    //If the gain is persistent, it does not get removed when its source is deactivated.
    public persistent: boolean = false;
    //If the gain is ignorePersistent, it gets removed when its source is deactivated, even when the condition is usually persistent.
    public ignorePersistent: boolean = false;
    //If the gain is ignorePersistentAtChoiceChange, it gets removed when the parent condition changes choices, even when it is persistent.
    public ignorePersistentAtChoiceChange: boolean = false;
    //For conditions gained by conditions, if lockedByParent is set, this condition cannot be removed until the condition with the source ID is gone.
    public lockedByParent: boolean = false;
    //If valueLockedByParent is set, the condition value can't be changed while the parent condition exists.
    public valueLockedByParent: boolean = false;
    //For spells, designate if the condition is meant for the caster or "" for the normal target creature.
    public targetFilter: string = "";
    //Some conditions have a choice that you can make. That is stored in this value.
    public choice: string = "";
    //If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType, the choice will be set to the subtype of that feat. This overrides any manual choice.
    public choiceBySubType: string = "";
    //If choiceLocked is true, the choice can't be changed manually.
    public choiceLocked: boolean = false;
    //If hideChoices is true, the choice isn't visible on activities or spells.
    public hideChoices: boolean = false;
    //Only for activities and spells: If copyChoiceFrom is set, the choice isn't visible, but is copied from a different choice on the same spell or activity.
    //If there are multiple conditions with the same name, the first one's choice is taken. So in cases like Inspire Courage, make sure that the second condition copies from the first, not the other way around.
    public copyChoiceFrom: string = "";
    //If acknowledgedInputRequired is true, the inputRequired message is not shown.
    public acknowledgedInputRequired: boolean = false;
    //Aeon stones and their activities can have resonant condition gains. These only get apply if the stone is slotted in a wayfinder (or activated while slotted in a wayfinder, respectively).
    public resonant: boolean = false;
    //Some conditions allow you to select other conditions to override. These are saved here.
    public selectedOtherConditions: string[] = [];
    //Permanent conditions from feats and items cannot be removed.
    public fromFeat: boolean = false;
    public fromItem: boolean = false;
    recast() {
        this.gainActivities = this.gainActivities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        return this;
    }
    get durationIsDynamic() {
        return this.duration == -5;
    }
    get durationIsPermanent() {
        return this.duration == -1;
    }
    get durationIsUntilRest() {
        return this.duration == -2;
    }
    get durationIsUntilRefocus() {
        return this.duration == -3;
    }
    get durationIsInstant() {
        return [1,3].includes(this.duration);
    }
    get durationDependsOnOther() {
        return this.duration % 5 == 2 || this.duration == 3;
    }
    get durationEndsOnOtherTurnChange() {
        return [2,3].includes(this.duration);
    }
}