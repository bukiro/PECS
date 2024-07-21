/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, switchMap, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect } from 'src/app/classes/effects/effect';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class TimeBlockingService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) { }

    public waitingDescription$(
        duration: number,
        options: { includeResting: boolean },
    ): Observable<string | undefined> {
        const afflictionOnsetsWithinDuration = (creature: Creature): boolean =>
            this._creatureConditionsService
                .currentCreatureConditions(creature, {}, { readonly: true })
                .some(gain =>
                    (
                        !this._conditionsDataService.conditionFromName(gain.name).automaticStages &&
                        !gain.paused &&
                        gain.nextStage < duration &&
                        gain.nextStage > 0
                    ) ||
                    gain.nextStage === -1 ||
                    gain.durationIsInstant);

        const timeStopConditionsActive = (creature: Creature): boolean =>
            this._creatureConditionsService
                .currentCreatureConditions(creature, {}, { readonly: true })
                .some(gain =>
                    this._conditionsDataService
                        .conditionFromName(gain.name)
                        .stopTimeChoiceFilter
                        .some(filter => [gain.choice, 'All'].includes(filter)),
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
                            this._creatureEffectsService.effectsOnThis$(creature, 'Resting Blocked')
                                .pipe(
                                    map(blockedEffects => ({ creature, blockedEffects })),
                                ),
                        ),
                )),
                map(creatureSets => {
                    let result: string | undefined;

                    creatureSets.forEach(({ creature, blockedEffects }) => {
                        if (afflictionOnsetsWithinDuration(creature)) {
                            result =
                                `One or more conditions${ creature.isCharacter()
                                    ? ''
                                    : ` on your ${ creature.type }`
                                } need to be resolved before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
                        }

                        if (options.includeResting && timeStopConditionsActive(creature)) {
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
