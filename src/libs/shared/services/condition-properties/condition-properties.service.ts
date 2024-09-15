/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, of, switchMap, distinctUntilChanged, map, shareReplay, combineLatest } from 'rxjs';
import { ConditionChoice } from 'src/app/classes/character-creation/condition-choice';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CreatureService } from '../creature/creature.service';
import { Condition } from 'src/app/classes/conditions/condition';
import { emptySafeCombineLatest } from '../../util/observable-utils';
import { stringsIncludeCaseInsensitive } from '../../util/string-utils';
import { cachedObservable } from '../../util/cache-utils';
import { isEqualPrimitiveArray } from '../../util/compare-utils';

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
    public isConditionInformational$(
        condition: Condition,
        {
            creature, gain,
        }: {
            creature: Creature; gain?: ConditionGain;
        },
    ): Observable<boolean> {
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
            return of(false);
        }

        // Without a conditionGain, no further conditions can be true, so the condition is informational.
        if (!gain) {
            return of(true);
        }

        return combineLatest([
            gain.choice$.pipe(distinctUntilChanged()),
            condition.isStoppingTime$(gain).pipe(distinctUntilChanged()),
            condition.appliedConditionOverrides$(gain).pipe(distinctUntilChanged(isEqualPrimitiveArray)),
            condition.appliedConditionPauses$(gain).pipe(distinctUntilChanged(isEqualPrimitiveArray)),
            creature.conditions.values$,
        ])
            .pipe(
                map(([choice, isStoppingTime, overrides, pauses, conditions]) =>
                    !(
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
                    )),
            );


    }

    /**
     * Creates an observable for the effective choices for this condition at this spell level,
     * then saves it on the condition for later use and returns.
     * If the observable exists on the condition already, just returns it.
     */
    public effectiveChoices$(
        condition: Condition,
        spellLevel: number = condition.minLevel,
    ): Observable<Array<string>> {
        return cachedObservable(
            emptySafeCombineLatest(
                condition.choices.map(choice => {
                    const requirementSources$: Array<Observable<boolean>> = [];

                    //The default choice is never tested. This ensures a fallback if no choices are available.
                    if (choice.name === condition.choice) {
                        return of(choice);
                    }

                    if (choice.spelllevelreq) {
                        requirementSources$.push(of(spellLevel >= choice.spelllevelreq));
                    }

                    if (choice.featreq?.length) {

                        choice.featreq.forEach(featreq => {

                            const testFeats = featreq.split(' or ');

                            requirementSources$.push(
                                emptySafeCombineLatest(
                                    testFeats.map(testFeat => {
                                        if (featreq.includes('Familiar:')) {
                                            testFeat = featreq.split('Familiar:')[1]?.trim() ?? '';

                                            if (testFeat) {
                                                return CreatureService.familiar$
                                                    .pipe(
                                                        switchMap(familiar =>
                                                            this._creatureFeatsService.creatureHasFeat$(
                                                                testFeat,
                                                                { creature: familiar },
                                                            ),
                                                        ),
                                                        map(result => !!result),
                                                        distinctUntilChanged(),
                                                    );
                                            }

                                            return of(false);
                                        } else {
                                            return this._characterFeatsService.characterHasFeatAtLevel$(
                                                testFeat,
                                                0,
                                                { allowCountAs: true },
                                            )
                                                .pipe(distinctUntilChanged());
                                        }
                                    }),
                                )
                                    .pipe(
                                        map(hasFeats => hasFeats.includes(true)),
                                    ),
                            );

                        });
                    }

                    return emptySafeCombineLatest(requirementSources$)
                        .pipe(
                            map(requirements =>
                                requirements.every(requirement => !!requirement)
                                    ? choice
                                    : null,
                            ),
                        );
                }),
            )
                .pipe(
                    map(choices =>
                        choices
                            .filter((choice): choice is ConditionChoice => !!choice)
                            .map(choice => choice.name),
                    ),
                    shareReplay({ refCount: true, bufferSize: 1 }),
                ),
            { store: condition.effectiveChoicesBySpellLevel$, key: spellLevel },
        );
    }

}
