import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { ItemActivity } from 'src/libs/shared/activities/util/models/item-activity';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';
import { SpellGain } from '../../util/models/spell-gain';
import { SpellTarget } from '../../util/models/spell-target';
import { SpellTargetSelection } from '../../util/models/spell-target-selection';

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
                targets.push(CreatureService.character$$());
                break;
            case CreatureTypes.AnimalCompanion:
                targets.push(CreatureService.animalCompanion$$());
                break;
            case CreatureTypes.Familiar:
                targets.push(CreatureService.familiar$$());
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
