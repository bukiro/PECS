import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Speed } from 'src/app/classes/creatures/speed';
import { Effect, RelativeEffect, AbsoluteEffect } from 'src/app/classes/effects/effect';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';

interface CalculatedSpeed {
    name: string;
    value: { result: number; explain: string };
    showPenalties: boolean;
    showBonuses: boolean;
    absolutes: Array<Effect>;
    relatives: Array<Effect>;
}

const minimumLoweredSpeed = 5;

@Injectable({
    providedIn: 'root',
})
export class SpeedValuesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
    ) { }

    public calculate$(speed: Speed, creature: Creature): Observable<CalculatedSpeed> {
        return combineLatest([
            this.value$(speed, creature),
            this._showPenalties$(creature, speed.name, { includeGeneralSpeed: true }),
            this._showBonuses$(creature, speed.name, { includeGeneralSpeed: true }),
            this._absolutes$(creature, speed.name, { includeGeneralSpeed: true }),
            this._relatives$(creature, speed.name, { includeGeneralSpeed: true }),
        ])
            .pipe(
                map(([value, showPenalties, showBonuses, absolutes, relatives]) => ({
                    name: speed.name,
                    value,
                    showPenalties,
                    showBonuses,
                    absolutes,
                    relatives,
                })),
            );
    }

    public value$(speed: Speed, creature: Creature): Observable<{ result: number; explain: string }> {
        return combineLatest([
            this._baseValue$(speed, creature),
            this._relatives$(creature, 'Speed'),
        ])
            .pipe(
                map(([baseValue, speedEffects]) => {
                    const value = baseValue;

                    const isNull: boolean = (value.result === 0);

                    // If there is a general speed penalty (or bonus), it applies to all speeds.
                    // We apply it to the base speed only here so we can still use the base speed for effects that require it
                    // (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
                    if (speed.name !== 'Speed') {
                        // TODO: Replace explain with Array<BonusDescription>, then replace this with applyEffectsToValue
                        speedEffects.forEach(effect => {
                            value.result += effect.valueNumerical;
                            value.explain += `\n${ effect.source }: ${ effect.value }`;
                        });
                    }

                    if (!isNull && value.result < minimumLoweredSpeed && speed.name !== 'Speed') {
                        value.result = minimumLoweredSpeed;
                        value.explain += `\nEffects cannot lower a speed below ${ minimumLoweredSpeed }.`;
                    }

                    value.explain = value.explain.trim();

                    return value;

                }),
            );
    }

    private _baseValue$(speed: Speed, creature: Creature): Observable<{ result: number; explain: string }> {
        //Get the base speed from the ancestry.
        const baseValue = creature.baseSpeed$$(speed.name);

        return combineLatest([
            this._absolutes$(creature, speed.name),
            this._relatives$(creature, speed.name),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    //Gets the basic speed and adds all effects

                    // TODO: replace explain with Array<BonusDescription>, then replace this with applyEffectsToValue
                    absolutes.forEach(effect => {
                        baseValue.result = effect.setValueNumerical;
                        baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
                    });

                    const isZero: boolean = (baseValue.result === 0);

                    // TODO: replace explain with Array<BonusDescription>, then replace this with applyEffectsToValue
                    relatives.forEach(effect => {
                        baseValue.result += effect.valueNumerical;
                        baseValue.explain += `\n${ effect.source }: ${ effect.value }`;
                    });

                    // Penalties cannot lower a speed below 5.
                    // It's okay for absolutes to remove a speed by setting it to 0.
                    if (!isZero && baseValue.result < minimumLoweredSpeed && speed.name !== 'Speed') {
                        baseValue.result = minimumLoweredSpeed;
                        baseValue.explain += `\nEffects cannot lower a speed below ${ minimumLoweredSpeed }.`;
                    }

                    baseValue.explain = baseValue.explain.trim();

                    return baseValue;
                }),
            );
    }

    private _relatives$(creature: Creature, name: string, options?: { includeGeneralSpeed?: boolean }): Observable<Array<RelativeEffect>> {
        if (options?.includeGeneralSpeed) {
            return this._creatureEffectsService.relativeEffectsOnThese$$(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.relativeEffectsOnThis$$(creature, name);
        }
    }

    private _absolutes$(creature: Creature, name: string, options?: { includeGeneralSpeed?: boolean }): Observable<Array<AbsoluteEffect>> {
        if (options?.includeGeneralSpeed) {
            return this._creatureEffectsService.absoluteEffectsOnThese$$(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.absoluteEffectsOnThis$$(creature, name);
        }
    }

    private _showBonuses$(creature: Creature, name: string, options?: { includeGeneralSpeed?: boolean }): Observable<boolean> {
        if (options?.includeGeneralSpeed) {
            return this._creatureEffectsService.doBonusEffectsExistOnThese$$(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.doBonusEffectsExistOnThis$$(creature, name);
        }
    }

    private _showPenalties$(creature: Creature, name: string, options?: { includeGeneralSpeed?: boolean }): Observable<boolean> {
        if (options?.includeGeneralSpeed) {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThese$$(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThis$$(creature, name);
        }
    }

}
