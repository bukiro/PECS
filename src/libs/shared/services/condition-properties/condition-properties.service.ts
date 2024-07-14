/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, combineLatest, of, switchMap, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { ConditionChoice } from 'src/app/classes/character-creation/condition-choice';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CreatureService } from '../creature/creature.service';
import { Condition } from 'src/app/classes/conditions/condition';

@Injectable({
    providedIn: 'root',
})
export class ConditionPropertiesService {

    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public isConditionInformational(
        creature: Creature,
        condition: Condition,
        conditionGain?: ConditionGain,
    ): boolean {
        //Return whether the condition has any effects beyond showing text, and if it causes or overrides any currently existing conditions.
        return !(
            !!condition.effects?.length ||
            !!condition.endConditions.length ||
            !!condition.gainItems.length ||
            !!condition.gainActivities.length ||
            !!condition.senses.length ||
            !!condition.nextCondition.length ||
            !!condition.endEffects.length ||
            !!condition.denyConditions.length ||
            condition.isStoppingTime(conditionGain) ||
            (
                condition.hints.some(hint =>
                    hint.effects?.length &&
                    (
                        !conditionGain ||
                        !hint.conditionChoiceFilter.length ||
                        hint.conditionChoiceFilter.includes(conditionGain.choice)
                    ),
                )
            ) ||
            (
                condition.gainConditions.length ?
                    this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
                        .some(existingCondition => !conditionGain || existingCondition.parentID === conditionGain.id) :
                    false
            ) ||
            (
                condition.overrideConditions.length ?
                    this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
                        .some(existingCondition =>
                            condition.conditionOverrides(conditionGain).some(override =>
                                override.name === existingCondition.name &&
                                (
                                    !override.conditionChoiceFilter?.length ||
                                    override.conditionChoiceFilter.includes(conditionGain?.choice || '')
                                ),
                            ),
                        ) :
                    false
            ) ||
            (
                condition.pauseConditions.length ?
                    this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
                        .some(existingCondition =>
                            condition.conditionPauses(conditionGain).some(pause =>
                                pause.name === existingCondition.name &&
                                (
                                    !pause.conditionChoiceFilter?.length ||
                                    pause.conditionChoiceFilter.includes(conditionGain?.choice || '')
                                ),
                            ),
                        ) :
                    false
            )
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
        if (!condition.effectiveChoicesBySpellLevel$.get(spellLevel)) {
            condition.effectiveChoicesBySpellLevel$.set(
                spellLevel,
                combineLatest(
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
                                    combineLatest(
                                        testFeats.map(testFeat => {
                                            if (featreq.includes('Familiar:')) {
                                                testFeat = featreq.split('Familiar:')[1].trim();

                                                if (testFeat) {
                                                    return CreatureService.familiar$
                                                        .pipe(
                                                            switchMap(familiar =>
                                                                this._creatureFeatsService.creatureHasFeat$(
                                                                    testFeat,
                                                                    { creature: familiar },
                                                                ),
                                                            ),
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
                                                    .pipe(
                                                        distinctUntilChanged(),
                                                    );
                                            }
                                        }),
                                    )
                                        .pipe(
                                            map(hasFeats => hasFeats.some(hasFeat => !!hasFeat)),
                                        ),
                                );

                            });
                        }

                        return combineLatest(requirementSources$)
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
            );
        }

        return condition.effectiveChoicesBySpellLevel$.get(spellLevel)
            // This fallback will never happen, but is necessary for code safety.
            ?? of(condition.choices.map(choice => choice.name));
    }

}
