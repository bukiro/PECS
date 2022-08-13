import { Injectable } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Creature } from 'src/app/classes/Creature';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { TimeService } from 'src/app/services/time.service';

@Injectable({
    providedIn: 'root',
})
export class ActivityGainPropertiesService {

    constructor(
        private readonly _effectsService: CreatureEffectsService,
        private readonly _timeService: TimeService,
        private readonly _activitiesDataService: ActivitiesDataService,
    ) { }

    public originalActivity(gain: ActivityGain | ItemActivity): Activity {
        if (gain.isOwnActivity()) {
            return gain;
        } else {
            return this._activitiesDataService.activityFromName(gain.name);
        }
    }

    public gainDisabledReason(
        gain: ActivityGain | ItemActivity,
        context: { creature: Creature; maxCharges: number },
    ): string {
        if (gain.active) {
            return '';
        }

        if (gain.chargesUsed >= context.maxCharges) {
            if (gain.activeCooldown) {
                const durationDescription = this._timeService.durationDescription(gain.activeCooldown, true, false);

                return `${ context.maxCharges ? 'Recharged in:' : 'Cooldown:' } ${ durationDescription }`;
            } else if (context.maxCharges) {
                return 'No activations left.';
            }
        }

        const disablingEffects = this._effectsService.effectsOnThis(context.creature, `${ gain.name } Disabled`);

        if (disablingEffects.length) {
            return `Disabled by: ${ disablingEffects.map(effect => effect.source).join(', ') } `;
        }

        return '';
    }

}
