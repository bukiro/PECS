import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Observable, of, switchMap, tap } from 'rxjs';
import { ConditionGainPair } from './condition-gain-pair';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureService } from '../creature/creature.service';
import { stringEqualsCaseInsensitive } from '../../util/string-utils';
import { CreatureConditionRemovalService } from './creature-condition-removal.service';
import { CreatureConditionsService } from './creature-conditions.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionsCleanupService {
    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
    ) {
        CreatureService.character$$
            .pipe(
                switchMap(creature =>
                    this._cleanupInvalidConditions$(creature),
                ),
            )
            .subscribe();

        this._creatureAvailabilityService.companionIfAvailable$$()
            .pipe(
                switchMap(creature => creature ? this._cleanupInvalidConditions$(creature) : of(undefined)),
            )
            .subscribe();

        this._creatureAvailabilityService.familiarIfAvailable$$()
            .pipe(
                switchMap(creature => creature ? this._cleanupInvalidConditions$(creature) : of(undefined)),
            )
            .subscribe();
    }

    private _cleanupInvalidConditions$(creature: Creature): Observable<Array<ConditionGainPair>> {
        return this._creatureConditionsService.allCreatureConditions$(creature)
            .pipe(
                tap(conditions => {
                    const conditionsToRemove =
                        conditions
                            .filter(({ condition, gain }) =>
                                // Does the condition not match the gain?
                                (!stringEqualsCaseInsensitive(condition.name, gain.name))
                                // Is the gain's duration expired?
                                || (gain.duration === 0)
                                // Is the gain's value expired? Only if the condition comes with a value.
                                || (condition.hasValue && gain.value <= 0),
                            );

                    if (conditionsToRemove.length) {
                        this._creatureConditionRemovalService.removeConditions(
                            conditionsToRemove,
                            creature,
                            { allowRemoveLockedByParentConditions: true },
                        );
                    }
                }),
            );
    }

}
