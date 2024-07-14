import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Creature } from 'src/app/classes/creatures/creature';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { SpellTarget } from 'src/app/classes/spells/spell-target';
import { CreatureTypes } from '../../definitions/creature-types';
import { SpellTargetSelection } from '../../definitions/types/spell-target-selection';
import { CreatureService } from '../creature/creature.service';

@Injectable({
    providedIn: 'root',
})
export class SpellTargetService {

    // Find out what creatures are affected by a spell or activity, based on the target string.
    public determineTargetsFromSpellTarget(
        target: SpellTargetSelection,
        context: { gain: SpellGain | ActivityGain | ItemActivity; creature: Creature },
    ): Array<Creature | SpellTarget> {

        const targets: Array<Creature | SpellTarget> = [];

        switch (target) {
            case 'self':
                targets.push(context.creature);
                break;
            case CreatureTypes.Character:
                targets.push(CreatureService.character);
                break;
            case CreatureTypes.AnimalCompanion:
                targets.push(CreatureService.character.class.animalCompanion);
                break;
            case CreatureTypes.Familiar:
                targets.push(CreatureService.character.class.familiar);
                break;
            case 'Selected':
                if (context.gain) {
                    targets.push(...context.gain.targets.filter(gainTarget => gainTarget.selected));
                }

                break;
            default: break;
        }

        return targets;
    }

}
