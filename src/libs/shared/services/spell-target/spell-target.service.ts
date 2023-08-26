import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Creature } from 'src/app/classes/Creature';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { SpellTargetSelection } from '../../definitions/types/spellTargetSelection';

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
