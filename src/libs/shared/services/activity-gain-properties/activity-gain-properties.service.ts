import { Injectable } from '@angular/core';
import { Observable, combineLatest, distinctUntilChanged, of, map, tap, shareReplay } from 'rxjs';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Creature } from 'src/app/classes/Creature';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';

@Injectable({
    providedIn: 'root',
})
export class ActivityGainPropertiesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _durationsService: DurationsService,
    ) { }

    public disabledReason$(
        gain: ActivityGain | ItemActivity,
        context: { creature: Creature; maxCharges$: Observable<number> },
    ): Observable<string> {
        return combineLatest([
            gain.active$,
            gain.innerActiveCooldown$,
            gain.chargesUsed$,
            context.maxCharges$,
            this._creatureEffectsService.effectsOnThis$(context.creature, `${ gain.name } Disabled`),
        ])
            .pipe(
                map(([active, activeCooldown, chargesUsed, maxCharges, disablingEffects]) => {
                    if (active) {
                        return '';
                    }

                    if (chargesUsed >= maxCharges) {
                        if (activeCooldown) {
                            const durationDescription = this._durationsService.durationDescription(activeCooldown, true, false);

                            return `${ maxCharges ? 'Recharged in:' : 'Cooldown:' } ${ durationDescription }`;
                        } else if (maxCharges) {
                            return 'No activations left.';
                        }
                    }

                    if (disablingEffects.length) {
                        return `Disabled by: ${ disablingEffects.map(effect => effect.source).join(', ') } `;
                    }

                    return '';
                }),
            );
    }

    /**
     * Creates an observable for the effective active cooldown for this activity gain,
     * depending on the effective cooldown of the activity for this creature,
     * then saves it on the activity gain for later use and returns.
     * If the observable exists on the activity already, just returns it.
     *
     * Only one creature's observable is kept, since activity gains are unique.
     */
    public activeCooldown$(
        gain: ActivityGain | ItemActivity,
        context: { creature: Creature },
    ): Observable<number> {
        if (!gain.activeCooldownByCreature$.get(context.creature.id)) {
            gain.activeCooldownByCreature$.clear();

            gain.activeCooldownByCreature$.set(
                context.creature.id,
                combineLatest([
                    gain.originalActivity.effectiveCooldownByCreature$.get(context.creature.id)
                        ?.pipe(
                            distinctUntilChanged(),
                        ) ?? of(0),
                    gain.innerActiveCooldown$
                        .pipe(
                            distinctUntilChanged(),
                        ),
                ])
                    .pipe(
                        map(cooldowns =>
                            // Return the shortest cooldown between the activity's and the gains.
                            cooldowns.some(cooldown => !!cooldown)
                                ? Math.min(
                                    ...cooldowns
                                        .filter(cooldown => !!cooldown),
                                )
                                : 0,
                        ),
                        tap(effectiveCooldown => {
                            // This updates _activeCooldown$ again, which repeats the pipe if it changed.
                            gain.activeCooldown = effectiveCooldown;
                        }),
                        shareReplay({ refCount: true, bufferSize: 1 }),
                    ),
            );
        }

        return gain.activeCooldownByCreature$.get(context.creature.id) ?? of(0);
    }

}
