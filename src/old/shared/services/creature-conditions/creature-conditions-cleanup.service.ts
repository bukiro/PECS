import { effect, Injectable } from '@angular/core';
import { CreatureConditionRemovalService } from 'src/libs/shared/conditions/domain/services/creature-condition-removal.service';
import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';

@Injectable({
    providedIn: 'root',
})
export class CreatureConditionsCleanupService {
    constructor(
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
    ) {
        effect(() => {
            const character = CreatureService.character$$();
            const conditions = character.conditions();

            this._cleanupInvalidConditions$(conditions, character);
        });

        effect(() => {
            const familiar = CreatureService.familiar$$();
            const conditions = familiar.conditions();

            this._cleanupInvalidConditions$(conditions, familiar);
        });

        effect(() => {
            const companion = CreatureService.animalCompanion$$();
            const conditions = companion.conditions();

            this._cleanupInvalidConditions$(conditions, companion);
        });
    }

    private _cleanupInvalidConditions$(
        conditions: Array<ConditionGain>,
        creature: Creature,
    ): void {
        const conditionsToRemove = conditions.filter(gain =>
            // Is the gain's duration expired?
            (gain.duration() === 0)
            // Is the gain's value expired? Only if the condition comes with a value.
            || (gain.originalCondition$$().hasValue && gain.value() <= 0),
        );

        if (conditionsToRemove.length) {
            this._creatureConditionRemovalService.removeConditions(
                conditionsToRemove,
                creature,
                { allowRemoveLockedByParentConditions: true },
            );
        }
    }

}
