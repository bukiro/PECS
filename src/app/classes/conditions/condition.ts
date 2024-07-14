import { Observable } from 'rxjs';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { heightenedTextFromDescSets } from 'src/libs/shared/util/description-utils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ActivityGain } from '../activities/activity-gain';
import { AttackRestriction } from '../attacks/attack-restriction';
import { ConditionChoice } from '../character-creation/condition-choice';
import { SenseGain } from '../creatures/sense-gain';
import { EffectGain } from '../effects/effect-gain';
import { Hint } from '../hints/hint';
import { ItemGain } from '../items/item-gain';
import { HeightenedDescriptionVariableCollection } from '../spells/heightened-description-variable-collection';
import { ConditionDuration } from './condition-duration';
import { ConditionGain } from './condition-gain';

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

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Condition>({
    primitives: [
        'name',
        'type',
        'buff',
        'minLevel',
        'hasValue',
        'decreasingValue',
        'value',
        'automaticStages',
        'circularStages',
        'desc',
        'inputRequired',
        'hide',
        'alwaysApplyCasterCondition',
        'sourceBook',
        'persistent',
        'restricted',
        'radius',
        'allowRadiusChange',
        'notes',
        'choice',
        'unlimited',
    ],
    primitiveArrays: [
        'denyConditions',
        'stopTimeChoiceFilter',
        'traits',
    ],
    primitiveObjectArrays: [
        'endConditions',
        'endsWithConditions',
        'overrideConditions',
        'pauseConditions',
        'selectOtherConditions',
    ],
    serializableArrays: {
        attackRestrictions:
            () => obj => AttackRestriction.from(obj),
        choices:
            () => obj => ConditionChoice.from(obj),
        defaultDurations:
            () => obj => ConditionDuration.from(obj),
        effects:
            () => obj => EffectGain.from(obj),
        endEffects:
            () => obj => EffectGain.from(obj),
        gainActivities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity(obj),
            }),
        gainConditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        gainItems:
            () => obj => ItemGain.from(obj),
        heightenedDescs:
            () => obj => HeightenedDescriptionVariableCollection.from(obj),
        hints:
            () => obj => Hint.from(obj),
        nextCondition:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        onceEffects:
            () => obj => EffectGain.from(obj),
        senses:
            () => obj => SenseGain.from(obj),
    },
});

export class Condition implements Serializable<Condition> {
    public name = '';
    public type = '';
    public buff = false;
    public minLevel = 0;
    public hasValue = false;
    public decreasingValue = false;
    public value = 0;
    public automaticStages = false;
    public circularStages = false;
    public desc = '';
    public inputRequired = '';
    public hide = false;
    /**
     * If alwaysApplyCasterCondition is true and this is a caster condition,
     * it is applied even when it is informational and the caster is already getting the target condition.
     */
    public alwaysApplyCasterCondition = false;
    public sourceBook = '';
    public persistent = false;
    /** Restricted conditions can be seen, but not taken from the conditions menu. */
    public restricted = false;
    public radius = 0;
    public allowRadiusChange = false;
    /** If a condition has notes (like the HP of a summoned object), they get copied on the conditionGain. */
    public notes = '';
    /** This property is only used to select a default choice before adding the condition. It is not read when evaluating the condition. */
    public choice = '';
    /** All instances of an unlimited condition are shown in the conditions area. Limited conditions only show one instance. */
    public unlimited = false;

    public denyConditions: Array<string> = [];
    /**
     * If the stopTimeChoiceFilter matches the condition choice or is "All",
     * no time elapses for anything other than the condition that causes the time stop.
     */
    public stopTimeChoiceFilter: Array<string> = [];
    public traits: Array<string> = [];

    public endConditions: Array<ConditionEnd> = [];
    /** Remove this condition if any of the endsWithConditions is removed. */
    public endsWithConditions: Array<EndsWithCondition> = [];
    /** Overridden conditions aren't applied, but keep ticking. */
    public overrideConditions: Array<ConditionOverride> = [];
    /** Paused conditions don't tick. If you want to stop -and- hide a condition, you need to override it as well. */
    public pauseConditions: Array<ConditionOverride> = [];
    /**
     * Each selectCondition offers a select box that can be used to select one other active condition for later use.
     * The selected condition can be referenced in overrideConditions and pauseConditions as "selectedCondition|0" (or other index).
     */
    public selectOtherConditions: Array<{ title?: string; nameFilter?: Array<string>; typeFilter?: Array<string> }> = [];

    public attackRestrictions: Array<AttackRestriction> = [];
    /** List choices you can make for this condition. The first choice must never have a featreq. */
    public choices: Array<ConditionChoice> = [];
    public defaultDurations: Array<ConditionDuration> = [];
    public effects: Array<EffectGain> = [];
    public endEffects: Array<EffectGain> = [];
    public gainActivities: Array<ActivityGain> = [];
    public gainConditions: Array<ConditionGain> = [];
    public gainItems: Array<ItemGain> = [];
    public heightenedDescs: Array<HeightenedDescriptionVariableCollection> = [];
    public hints: Array<Hint> = [];
    public nextCondition: Array<ConditionGain> = [];
    public onceEffects: Array<EffectGain> = [];
    public senses: Array<SenseGain> = [];

    public effectiveChoicesBySpellLevel$ = new Map<number, Observable<Array<string>>>();

    constructor() {
        //Initially, if this.choice is not one of the available choices, set it to the first.
        if (
            this.choices.length
            && !this.choices
                .map(choice => choice.name)
                .includes(this.choice)
        ) {
            this.choice = this.choices[0].name;
        }
    }

    public static from(values: DeepPartial<Condition>, recastFns: RecastFns): Condition {
        return new Condition().with(values, recastFns);
    }

    public with(values: DeepPartial<Condition>, recastFns: RecastFns): Condition {
        // endsWithConditions has changed from string to object; this is patched here for existing conditions.
        if (values.endsWithConditions) {
            values.endsWithConditions = values.endsWithConditions.map(obj =>
                typeof obj === 'string'
                    ? { name: obj, source: '' }
                    : {
                        name: '',
                        source: '',
                        ...obj,
                    },
            );
        }

        // selectOtherConditions may come from the database in an incomplete state.
        if (values.selectOtherConditions) {
            values.selectOtherConditions = values.selectOtherConditions.map(obj => ({
                title: obj?.title ?? '',
                nameFilter: (obj?.nameFilter ?? []) as Array<string>,
                typeFilter: (obj?.typeFilter ?? []) as Array<string>,
            }));
        }

        assign(this, values, recastFns);

        this.gainActivities.forEach(gain => { gain.source = this.name; });

        this.gainConditions.forEach(gain => { gain.source = this.name; });

        //If choices exist and no default choice is given, take the first one as default.
        if (this.choices.length && !this.choice) {
            this.choice = this.choices[0].name;
        }

        return this;
    }

    public forExport(): DeepPartial<Condition> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Condition {
        return Condition.from(this, recastFns);
    }

    public isEqual(compared: Partial<Condition>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
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
