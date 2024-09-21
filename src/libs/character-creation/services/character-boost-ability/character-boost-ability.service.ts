import { Injectable } from '@angular/core';
import { AbilityChoice } from 'src/app/classes/character-creation/ability-choice';

@Injectable({
    providedIn: 'root',
})
export class CharacterBoostAbilityService {

    public boostAbility(
        abilityName: string,
        taken: boolean,
        choice: AbilityChoice,
        locked: boolean,
    ): void {
        const type: string = choice.infoOnly ? 'Info' : choice.type;

        if (taken) {
            choice.boosts.push({ name: abilityName, type, source: choice.source, locked, sourceId: choice.id });
        } else {
            const oldBoost = choice.boosts.filter(boost =>
                boost.name === abilityName &&
                boost.type === type &&
                boost.locked === locked,
            )[0];

            choice.boosts = choice.boosts.filter(boost => boost !== oldBoost);
        }
    }

}
