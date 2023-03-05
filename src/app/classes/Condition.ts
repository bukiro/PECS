import { ConditionGain } from 'src/app/classes/ConditionGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { AttackRestriction } from 'src/app/classes/AttackRestriction';
import { SenseGain } from 'src/app/classes/SenseGain';
import { Hint } from 'src/app/classes/Hint';
import { ConditionChoice } from 'src/app/classes/ConditionChoice';
import { ConditionDuration } from 'src/app/classes/ConditionDuration';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { heightenedTextFromDescSets } from 'src/libs/shared/util/descriptionUtils';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

interface ConditionEnd {
    name: string;
    increaseWounded?: boolean;
    sameCasterOnly?: boolean;
}

interface EndsWithCondition {
    name: string;
    source?: string;
}

export interface ConditionOverride {
    name: string;
    conditionChoiceFilter?: Array<string>;
}


export interface OtherConditionSelection {
    title?: string;
    nameFilter?: Array<string>;
    typeFilter?: Array<string>;
}

export class Condition {
    public name = '';
    public type = '';
    public buff = false;
    public minLevel = 0;
    public hasValue = false;
    public decreasingValue = false;
    public value = 0;
    public automaticStages = false;
    public circularStages = false;
    public heightenedDescs: Array<HeightenedDescSet> = [];
    public desc = '';
    public hints: Array<Hint> = [];
    public inputRequired = '';
    public onceEffects: Array<EffectGain> = [];
    public endEffects: Array<EffectGain> = [];
    public effects: Array<EffectGain> = [];
    public gainActivities: Array<ActivityGain> = [];
    public gainConditions: Array<ConditionGain> = [];
    public gainItems: Array<ItemGain> = [];
    public hide = false;
    /**
     * Each selectCondition offers a select box that can be used to select one other active condition for later use.
     * The selected condition can be referenced in overrideConditions and pauseConditions as "selectedCondition|0" (or other index).
     */
    public selectOtherConditions: Array<{ title?: string; nameFilter?: Array<string>; typeFilter?: Array<string> }> = [];
    public denyConditions: Array<string> = [];
    public endConditions: Array<ConditionEnd> = [];
    /**
     * If alwaysApplyCasterCondition is true and this is a caster condition,
     * it is applied even when it is informational and the caster is already getting the target condition.
     */
    public alwaysApplyCasterCondition = false;
    /** Remove this condition if any of the endsWithConditions is removed. */
    public endsWithConditions: Array<EndsWithCondition> = [];
    /**
     * If the stopTimeChoiceFilter matches the condition choice or is "All",
     * no time elapses for anything other than the condition that causes the time stop.
     */
    public stopTimeChoiceFilter: Array<string> = [];
    public attackRestrictions: Array<AttackRestriction> = [];
    public senses: Array<SenseGain> = [];
    public sourceBook = '';
    public nextCondition: Array<ConditionGain> = [];
    public defaultDurations: Array<ConditionDuration> = [];
    public persistent = false;
    /** Restricted conditions can be seen, but not taken from the conditions menu. */
    public restricted = false;
    public radius = 0;
    public allowRadiusChange = false;
    public traits: Array<string> = [];
    /** If a condition has notes (like the HP of a summoned object), they get copied on the conditionGain. */
    public notes = '';
    /** List choices you can make for this condition. The first choice must never have a featreq. */
    public choices: Array<ConditionChoice> = [];
    /** _choices is a temporary value that stores the filtered name list produced by get_Choices(); */
    public $choices: Array<string> = [];
    /** This property is only used to select a default choice before adding the condition. It is not read when evaluating the condition. */
    public choice = '';
    /** All instances of an unlimited condition are shown in the conditions area. Limited conditions only show one instance. */
    public unlimited = false;
    /** Overridden conditions aren't applied, but keep ticking. */
    public overrideConditions: Array<ConditionOverride> = [];
    /** Paused conditions don't tick. If you want to stop -and- hide a condition, you need to override it as well. */
    public pauseConditions: Array<ConditionOverride> = [];

    public recast(recastFns: RecastFns): Condition {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.onceEffects = this.onceEffects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.endEffects = this.endEffects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.effects = this.effects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.gainActivities = this.gainActivities.map(obj => recastFns.activityGain(obj).recast(recastFns));
        this.gainActivities.forEach(activityGain => {
            activityGain.source = this.name;
        });
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast(recastFns));
        this.gainConditions.forEach(conditionGain => {
            conditionGain.source = this.name;
        });
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.attackRestrictions = this.attackRestrictions.map(obj => Object.assign(new AttackRestriction(), obj).recast());
        this.senses = this.senses.map(obj => Object.assign(new SenseGain(), obj).recast());
        this.nextCondition = this.nextCondition.map(obj => Object.assign(new ConditionGain(), obj).recast(recastFns));
        this.defaultDurations = this.defaultDurations.map(obj => Object.assign(new ConditionDuration(), obj).recast());
        this.choices = this.choices.map(obj => Object.assign(new ConditionChoice(), obj).recast());

        //If choices exist and no default choice is given, take the first one as default.
        if (this.choices.length && !this.choice) {
            this.choice = this.choices[0].name;
        }

        this.selectOtherConditions = this.selectOtherConditions.map(selection => ({
            title: '',
            nameFilter: [],
            typeFilter: [], ...selection,
        }));
        //endsWithConditions has changed from string to object; this is patched here for existing conditions.
        this.endsWithConditions.forEach((endsWith, index) => {
            if (typeof endsWith === 'string') {
                this.endsWithConditions[index] = { name: endsWith, source: '' };
            }
        });

        return this;
    }

    public clone(recastFns: RecastFns): Condition {
        return Object.assign<Condition, Condition>(new Condition(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public conditionOverrides(gain?: ConditionGain): Array<ConditionOverride> {
        return this.overrideConditions.map(override => {
            let overrideName = override.name;

            if (gain && override.name.toLowerCase().includes('selectedcondition|')) {
                overrideName = gain.selectedOtherConditions[parseInt(override.name.toLowerCase().split('|')[1], 10) || 0] || overrideName;
            }

            return { name: overrideName, conditionChoiceFilter: override.conditionChoiceFilter };
        });
    }

    public conditionPauses(gain?: ConditionGain): Array<ConditionOverride> {
        return this.pauseConditions.map(pause => {
            let pauseName = pause.name;

            if (gain && pause.name.toLowerCase().includes('selectedcondition|')) {
                pauseName = gain.selectedOtherConditions[parseInt(pause.name.toLowerCase().split('|')[1], 10) || 0] || pauseName;
            }

            return { name: pauseName, conditionChoiceFilter: pause.conditionChoiceFilter };
        });
    }

    public hasEffects(): boolean {
        //Return whether the condition has any effects beyond showing text.
        return this.hasInstantEffects() || this.hasDurationEffects();
    }

    public hasInstantEffects(): boolean {
        //Return whether the condition has any effects that are instantly applied even if the condition has no duration.
        return (!!this.endConditions.length || !!this.onceEffects.length);
    }

    public hasDurationEffects(): boolean {
        //Return whether the condition has any effects that persist during its duration.
        return (
            !!this.effects?.length ||
            this.hints.some(hint => hint.effects?.length) ||
            !!this.gainConditions.length ||
            !!this.nextCondition.length ||
            !!this.overrideConditions.length ||
            !!this.denyConditions.length ||
            !!this.gainItems.length ||
            !!this.gainActivities.length ||
            !!this.senses.length ||
            !!this.endEffects.length
        );
    }

    public isChangeable(): boolean {
        //Return whether the condition has values that you can change.
        return this.hasValue || this.allowRadiusChange;
    }

    public isStoppingTime(conditionGain?: ConditionGain): boolean {
        return this.stopTimeChoiceFilter.some(filter => ['All', (conditionGain?.choice || 'All')].includes(filter));
    }

    public unfilteredChoices(): Array<string> {
        return this.choices.map(choice => choice.name);
    }

    public timeToNextStage(choiceName: string): number {
        return this.choices.find(choice => choice.name === choiceName)?.nextStage || 0;
    }

    public defaultDuration(choiceName = '', spellLevel = 0): { duration: number; source: string } | undefined {
        //Suggest a default duration for a condition in this order:
        // 1. The default duration of the current condition choice, if one exists
        // 2. If the condition has a minLevel (== is a spell), the default duration with the appropriate minLevel value, if one exists
        // 3. The first default duration, if one exists
        // 4. null
        //Returns {duration: number, source: string}
        const currentChoice = this.choices.find(choice => choice.name === choiceName);

        if (currentChoice?.defaultDuration != null) {
            return { duration: currentChoice.defaultDuration, source: currentChoice.name };
        }

        if (this.minLevel) {
            //Levelnumber should not be below minLevel, but might be in the conditions menu.
            let levelNumber = Math.max(this.minLevel, spellLevel);

            if (this.defaultDurations.some(defaultDuration => defaultDuration.minLevel)) {
                // Going down from levelNumber to minLevel, use the first default duration that matches the level.
                for (levelNumber; levelNumber >= this.minLevel; levelNumber--) {
                    const level = this.defaultDurations.find(defaultDuration => defaultDuration.minLevel === levelNumber);

                    if (level?.duration != null) {
                        return { duration: level.duration, source: `Spell level ${ levelNumber }` };
                    }
                }
            }
        }

        if (this.defaultDurations[0]?.duration != null) {
            return { duration: this.defaultDurations[0].duration, source: 'Default' };
        }
    }

    public heightenedItemGains(levelNumber: number): Array<ItemGain> {
        // This descends through the level numbers,
        // starting with levelNumber and returning the first set of ItemGains found with a matching heightenedfilter.
        // It also returns all items that have no heightenedFilter.
        // If there are no ItemGains with a heightenedFilter, return all.
        const itemGains: Array<ItemGain> = [];

        if (!this.gainItems.length) {
            return this.gainItems;
        }

        itemGains.push(...this.gainItems.filter(gain => !gain.heightenedFilter));

        if (this.gainItems.some(gain => gain.heightenedFilter)) {
            for (let levelNumberToTry = levelNumber; levelNumberToTry > 0; levelNumberToTry--) {
                const foundItemGains = this.gainItems.filter(gain => gain.heightenedFilter === levelNumberToTry);

                if (foundItemGains.length) {
                    itemGains.push(...foundItemGains);
                    break;
                }
            }
        }

        return itemGains;
    }

    public heightenedText(text: string, levelNumber: number): string {
        return heightenedTextFromDescSets(text, levelNumber, this.heightenedDescs);
    }
}
