import { Injectable } from '@angular/core';
import { Observable, combineLatest, switchMap, of, map, distinctUntilChanged, tap, shareReplay } from 'rxjs';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Creature } from 'src/app/classes/creatures/creature';
import { DurationsService } from '../../time/services/durations/durations.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { ActivityPropertiesService } from '../activity-properties/activity-properties.service';

@Injectable({
    providedIn: 'root',
})
export class ActivityGainPropertiesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _durationsService: DurationsService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
    ) { }

    public disabledReason$(
        gain: ActivityGain | ItemActivity,
        context: { creature: Creature; maxCharges$: Observable<number> },
    ): Observable<string> {
        return combineLatest([
            gain.active$,
            gain.activeCooldown$,
            gain.chargesUsed$,
            context.maxCharges$,
            this._creatureEffectsService.effectsOnThis$$(context.creature, `${ gain.name } Disabled`),
        ])
            .pipe(
                switchMap(([active, activeCooldown, chargesUsed, maxCharges, disablingEffects]) =>
                    (activeCooldown && (chargesUsed >= maxCharges)
                        ? this._durationsService.durationDescription$(activeCooldown, true, false)
                        : of('')
                    )
                        .pipe(
                            map(durationDescription => ({
                                active, activeCooldown, chargesUsed, maxCharges, disablingEffects, durationDescription,
                            })),
                        ),
                ),
                map(({ active, activeCooldown, chargesUsed, maxCharges, disablingEffects, durationDescription }) => {
                    if (active) {
                        return '';
                    }

                    if (chargesUsed >= maxCharges) {
                        if (activeCooldown) {
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
        if (!gain.activeCooldownByCreature$$.get(context.creature.id)) {
            gain.activeCooldownByCreature$$.clear();

            gain.activeCooldownByCreature$$.set(
                context.creature.id,
                combineLatest([
                    this._activityPropertiesService
                        .effectiveCooldown$(gain.originalActivity, context).pipe(distinctUntilChanged()),
                    gain.activeCooldown$.pipe(distinctUntilChanged()),
                ])
                    .pipe(
                        map(cooldowns =>
                            // Return the shortest cooldown between the activity's and the gain's.
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

        return gain.activeCooldownByCreature$$.get(context.creature.id) ?? of(0);
    }

}
