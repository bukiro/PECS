import { computed, Injectable, signal, Signal } from '@angular/core';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CreatureService } from '../creature/creature.service';
import { Condition } from 'src/app/classes/conditions/condition';
import { stringsIncludeCaseInsensitive } from '../../util/string-utils';
import { cachedSignal } from '../../util/cache-utils';
import { isDefined } from '../../util/type-guard-utils';

@Injectable({
    providedIn: 'root',
})
export class ConditionPropertiesService {

    constructor(
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    /**
     * Determine whether the condition has any effects beyond showing text,
     * and if it causes or overrides any currently existing conditions.
     *
     * A condition without any of these effects is purely informational.
     */
    public isConditionInformational$$(
        condition: Condition,
        {
            creature, gain,
        }: {
            creature: Creature; gain?: ConditionGain;
        },
    ): Signal<boolean> {
        // Handle static conditions first.
        if (
            !!condition.effects?.length
            || !!condition.endConditions.length
            || !!condition.gainItems.length
            || !!condition.gainActivities.length
            || !!condition.senses.length
            || !!condition.nextCondition.length
            || !!condition.endEffects.length
            || !!condition.denyConditions.length
        ) {
            return signal(false).asReadonly();
        }

        // Without a conditionGain, no further conditions can be true, so the condition is informational.
        if (!gain) {
            return signal(true).asReadonly();
        }

        return computed(() => {
            const choice = gain.choice();
            const isStoppingTime = condition.isStoppingTime$$(gain)();
            const overrides = condition.appliedConditionOverrides$$(gain)();
            const pauses = condition.appliedConditionPauses$$(gain)();
            const conditions = creature.conditions();

            return !(
                isStoppingTime
                || (
                    condition.hints.some(hint =>
                        hint.effects?.length
                        && (
                            !hint.conditionChoiceFilter.length ||
                            hint.conditionChoiceFilter.includes(choice)
                        ),
                    )
                )
                || (
                    condition.gainConditions.length
                        ? conditions.some(existingGain => existingGain.parentID === gain.id)
                        : false
                )
                || (
                    overrides.length
                        ? conditions.map(existingGain => existingGain.name)
                            .some(name =>
                                stringsIncludeCaseInsensitive(overrides, name),
                            )
                        : false
                )
                || (
                    pauses.length
                        ? conditions.map(existingGain => existingGain.name)
                            .some(name =>
                                stringsIncludeCaseInsensitive(pauses, name),
                            )
                        : false
                )
            );
        });
    }

    /**
     * Creates an observable for the effective choices for this condition at this spell level,
     * then saves it on the condition for later use and returns.
     * If the observable exists on the condition already, just returns it.
     */
    public effectiveChoices$$(
        condition: Condition,
        spellLevel: number = condition.minLevel,
    ): Signal<Array<string>> {
        return cachedSignal(
            computed(() =>
                condition.choices.map(choice => {
                    const requirementResults: Array<boolean> = [];

                    //The default choice is never tested. This ensures a fallback if no choices are available.
                    if (choice.name === condition.choice) {
                        return choice;
                    }

                    if (choice.spelllevelreq) {
                        requirementResults.push(spellLevel >= choice.spelllevelreq);
                    }

                    if (choice.featreq?.length) {

                        choice.featreq.forEach(featreq => {

                            const alternativeTestFeats = featreq.split(' or ');

                            requirementResults.push(
                                alternativeTestFeats.map(testFeat => {
                                    if (featreq.includes('Familiar:')) {
                                        testFeat = featreq.split('Familiar:')[1]?.trim() ?? '';

                                        if (testFeat) {
                                            return !!this._creatureFeatsService.creatureHasFeat$$(
                                                testFeat,
                                                { creature: CreatureService.familiar$$() },
                                            )();
                                        }

                                        return signal(false).asReadonly();
                                    } else {
                                        return this._characterFeatsService.characterHasFeatAtLevel$$(
                                            testFeat,
                                            0,
                                            { allowCountAs: true },
                                        )();
                                    }
                                }).includes(true),
                            );
                        });
                    }

                    return requirementResults.every(requirementResult => !!requirementResult)
                        ? choice
                        : undefined;
                })
                    .filter(isDefined)
                    .map(choice => choice.name),
            ),
            { store: condition.effectiveChoicesBySpellLevel$$, key: spellLevel },
        );
    }

}
