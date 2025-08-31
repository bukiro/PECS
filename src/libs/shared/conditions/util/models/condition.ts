import { computed, signal, Signal } from '@angular/core';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { HeightenedDescriptionVariableCollection } from 'src/libs/shared/heightened-description/util/models/heightened-description-variable-collection';
import { heightenedTextFromDescSets } from 'src/libs/shared/heightened-description/util/utils/description-utils';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { AttackRestriction } from 'src/libs/shared/attacks/util/models/attack-restriction';
import { SenseGain } from 'src/libs/shared/senses/util/models/sense-gain';
import { ConditionChoice } from './condition-choice';
import { ConditionDuration } from './condition-duration';
import { ConditionGain } from './condition-gain';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { isDefined } from 'src/libs/shared/common/util/utils/type-guard-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';

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
            recastFns => obj => ActivityGain.from(obj, recastFns),
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
     * The selected condition can be referenced in overrideConditions and pauseConditions as "selectedCondition|0",
     * where "0" or another number is the index of the condition selection in this array.
     */
    public selectOtherConditions: Array<{ title?: string; nameFilter?: Array<string>; typeFilter?: Array<string> }> = [];

    public attackRestrictions: Array<AttackRestriction> = [];
    /** List choices you can make for this condition. The first choice must never have a featreq. */
    public choices: Array<ConditionChoice> = [];
    public defaultDurations: Array<ConditionDuration> = [];
    public effects: Array<EffectGain> = [];
    /** One-time effects that are triggered when the condition ends. */
    public endEffects: Array<EffectGain> = [];
    public gainActivities: Array<ActivityGain> = [];
    public gainConditions: Array<ConditionGain> = [];
    public gainItems: Array<ItemGain> = [];
    public heightenedDescs: Array<HeightenedDescriptionVariableCollection> = [];
    public hints: Array<Hint> = [];
    public nextCondition: Array<ConditionGain> = [];
    public onceEffects: Array<EffectGain> = [];
    public senses: Array<SenseGain> = [];

    public effectiveChoicesBySpellLevel$$ = new Map<number, Signal<Array<string>>>();

    private readonly _cache = {
        effectiveChoices: new WeakMap<Creature | { noCreature: true }, Map<number, Signal<Array<string>>>>(),
    };

    constructor() {
        //Initially, if this.choice is not one of the available choices, set it to the first.
        if (
            this.choices[0]
            && !this.choices
                .map(choice => choice.name)
                .includes(this.choice)
        ) {
            this.choice = this.choices[0].name;
        }
    }

    public get isChangeable(): boolean {
        //Return whether the condition has values that you can change.
        return this.hasValue || this.allowRadiusChange;
    }

    public get hasEffects(): boolean {
        //Return whether the condition has any effects beyond showing text.
        return this.hasInstantEffects || this.hasPersistentDurationEffects || this.hasTemporaryDurationEffects;
    }

    public get hasInstantEffects(): boolean {
        //Return whether the condition has any effects that are instantly applied even if the condition has no duration.
        return (!!this.endConditions.length || !!this.onceEffects.length);
    }

    public get hasPersistentDurationEffects(): boolean {
        // Return whether the condition has any effects that persist during its duration.
        // These effects cannot be prevented or cancelled.
        return !!this.effects?.length
            || !!this.nextCondition.length
            || !!this.denyConditions.length
            || !!this.gainItems.length
            || !!this.gainActivities.length
            || !!this.senses.length
            || !!this.endEffects.length;
    }

    public get hasTemporaryDurationEffects(): boolean {
        // Return whether the condition has any effects that happen during its duration, but can be over before its end.
        // This includes gaining, overriding or pausing conditions, as the matching conditions can be removed while this is active,
        // And hint effects, as hints can show or hide depending on the condition gain's choice.
        return !!this.gainConditions.length
            || this.hints.some(hint => hint.effects?.length)
            || !!this.overrideConditions.length
            || !!this.pauseConditions.length;
    }

    public static from(values: MaybeSerialized<Condition>, recastFns: RecastFns): Condition {
        return new Condition().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Condition>, recastFns: RecastFns): this {
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
        if (this.choices[0] && !this.choice) {
            this.choice = this.choices[0].name;
        }

        return this;
    }

    public forExport(): Serialized<Condition> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Condition.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Condition>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
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

    /**
     * (Cached) The effective choices for this condition at this spell level.
     */
    public effectiveChoices$$(
        spellLevel: number = this.minLevel,
        { creature }: { creature: Creature },
    ): Signal<Array<string>> {
        return weaklyCachedSignalWithKey(
            () => {
                const requirementResults$$ = this.choices.map(choice => {
                    const requirementResults: Array<Signal<boolean>> = [];

                    //The default choice is never tested. This ensures a fallback if no choices are available.
                    if (choice.name === this.choice) {
                        return { choice, requirementResults: [signal(true).asReadonly()] };
                    }

                    if (choice.spelllevelreq) {
                        requirementResults.push(signal(Math.max(spellLevel, this.minLevel) >= choice.spelllevelreq));
                    }

                    if (creature?.isCharacter()) {
                        choice.featreq.forEach(featreq => {
                            requirementResults.push(
                                creature.featsAdapter.matchesFeatReq$$(featreq),
                            );
                        });
                    }

                    return {
                        choice,
                        requirementResults,
                    };
                });

                return computed(() =>
                    requirementResults$$
                        .map(({ choice, requirementResults }) =>
                            requirementResults.map(result$$ => result$$()).includes(false) ? undefined : choice,
                        )
                        .filter(isDefined)
                        .map(choice => choice.name),
                );
            },
            { store: this._cache.effectiveChoices, objKey: creature ?? { noCreature: true }, key: spellLevel },
        );
    }
}
