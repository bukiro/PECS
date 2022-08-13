import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Creature } from 'src/app/classes/Creature';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';

@Injectable({
    providedIn: 'root',
})
export class TimeBlockingService {

    constructor(
        private readonly _effectsService: CreatureEffectsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _characterService: CharacterService,
    ) { }

    public waitingDescription(
        duration: number,
        options: { includeResting: boolean },
    ): string {
        let result = '';
        const AfflictionOnsetsWithinDuration = (creature: Creature): boolean =>
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

        const TimeStopConditionsActive = (creature: Creature): boolean =>
            this._creatureConditionsService
                .currentCreatureConditions(creature, {}, { readonly: true })
                .some(gain =>
                    this._conditionsDataService
                        .conditionFromName(gain.name)
                        .stopTimeChoiceFilter
                        .some(filter => [gain.choice, 'All'].includes(filter)),
                );
        const MultipleTempHPAvailable = (creature: Creature): boolean =>
            creature.health.temporaryHP.length > 1;
        const RestingBlockingEffectsActive = (creature: Creature): boolean =>
            this._effectsService.effectsOnThis(creature, 'Resting Blocked').some(effect => !effect.ignored);

        this._characterService.allAvailableCreatures().forEach(creature => {
            if (AfflictionOnsetsWithinDuration(creature)) {
                result =
                    `One or more conditions${ creature.isCharacter()
                        ? ''
                        : ` on your ${ creature.type }`
                    } need to be resolved before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
            }

            if (options.includeResting && TimeStopConditionsActive(creature)) {
                result =
                    `Time is stopped for ${ creature.isCharacter()
                        ? ' you'
                        : ` your ${ creature.type }`
                    }, and you cannot ${ options.includeResting ? 'rest' : 'continue' } until this effect has ended.`;
            }

            if (MultipleTempHPAvailable(creature)) {
                result =
                    `You need to select one set of temporary Hit Points${ creature.isCharacter()
                        ? ''
                        : ` on your ${ creature.type }`
                    } before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
            }

            if (options.includeResting && RestingBlockingEffectsActive(creature)) {
                result =
                    `An effect${ creature.isCharacter()
                        ? ''
                        : ` on your ${ creature.type }`
                    } is keeping you from resting.`;
            }
        });

        return result;
    }

}
