/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, switchMap, map, combineLatest, of } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect } from 'src/app/classes/effects/effect';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { AppliedCreatureConditionsService } from 'src/libs/shared/services/creature-conditions/applied-creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/util/string-utils';

@Injectable({
    providedIn: 'root',
})
export class TimeBlockingService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) { }

    public waitingDescription$(
        duration: number,
        options: { includeResting: boolean },
    ): Observable<string | undefined> {
        const afflictionOnsetsWithinDuration$ = (creature: Creature): Observable<boolean> =>
            this._appliedCreatureConditionsService
                .appliedCreatureConditions$(creature)
                .pipe(
                    map(conditions =>
                        conditions.some(({ gain, condition, paused }) =>
                            (
                                !condition.automaticStages &&
                                !paused &&
                                gain.nextStage < duration &&
                                gain.nextStage > 0
                            ) ||
                            gain.nextStage === -1 ||
                            gain.durationIsInstant,
                        ),
                    ),
                );

        const timeStopConditionsActive$ = (creature: Creature): Observable<boolean> =>
            this._appliedCreatureConditionsService
                .appliedCreatureConditions$(creature)
                .pipe(
                    map(conditions =>
                        conditions.some(({ gain, condition }) =>
                            condition
                                .stopTimeChoiceFilter
                                .some(filter =>
                                    stringsIncludeCaseInsensitive([gain.choice, 'All'], filter),
                                ),
                        ),
                    ),
                );

        const multipleTempHPAvailable = (creature: Creature): boolean =>
            creature.health.temporaryHP.length > 1;
        const restingBlockingEffectsActive = (blockingEffects: Array<Effect>): boolean =>
            blockingEffects.some(effect => !effect.ignored);

        return this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                switchMap(creatures => emptySafeCombineLatest(
                    creatures
                        .map(creature =>
                            combineLatest([
                                this._creatureEffectsService.effectsOnThis$(creature, 'Resting Blocked'),
                                afflictionOnsetsWithinDuration$(creature),
                                options.includeResting
                                    ? timeStopConditionsActive$(creature)
                                    : of(false),
                            ])
                                .pipe(
                                    map(([blockedEffects, hasAfflictionOnsets, hasTimeStops]) => ({
                                        creature,
                                        blockedEffects,
                                        hasAfflictionOnsets,
                                        hasTimeStops,
                                    })),
                                ),
                        ),
                )),
                map(creatureSets => {
                    let result: string | undefined;

                    creatureSets.forEach(({ creature, blockedEffects, hasAfflictionOnsets, hasTimeStops }) => {
                        if (hasAfflictionOnsets) {
                            result =
                                `One or more conditions${ creature.isCharacter()
                                    ? ''
                                    : ` on your ${ creature.type }`
                                } need to be resolved before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
                        }

                        if (hasTimeStops) {
                            result =
                                `Time is stopped for ${ creature.isCharacter()
                                    ? ' you'
                                    : ` your ${ creature.type }`
                                }, and you cannot ${ options.includeResting ? 'rest' : 'continue' } until this effect has ended.`;
                        }

                        if (multipleTempHPAvailable(creature)) {
                            result =
                                `You need to select one set of temporary Hit Points${ creature.isCharacter()
                                    ? ''
                                    : ` on your ${ creature.type }`
                                } before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
                        }

                        if (options.includeResting && restingBlockingEffectsActive(blockedEffects)) {
                            result =
                                `An effect${ creature.isCharacter()
                                    ? ''
                                    : ` on your ${ creature.type }`
                                } is keeping you from resting.`;
                        }
                    });

                    return result;
                }),
            );
    }

}
