import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { Speed } from 'src/app/classes/Speed';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';

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

    public calculate(speed: Speed, creature: Creature): CalculatedSpeed {
        return {
            name: speed.name,
            value: this.value(speed, creature),
            showPenalties: this._showPenalties(creature, speed.name, true),
            showBonuses: this._showBonuses(creature, speed.name, true),
            absolutes: this._absolutes(creature, speed.name, true),
            relatives: this._relatives(creature, speed.name, true),
        };
    }

    public value(speed: Speed, creature: Creature): { result: number; explain: string } {
        //If there is a general speed penalty (or bonus), it applies to all speeds. We apply it to the base speed here so we can still
        // copy the base speed for effects (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
        const value = this._baseValue(speed, creature);
        const isNull: boolean = (value.result === 0);

        if (speed.name !== 'Speed') {
            this._relatives(creature, 'Speed').forEach(effect => {
                value.result += parseInt(effect.value, 10);
                value.explain += `\n${ effect.source }: ${ effect.value }`;
            });
        }

        if (!isNull && value.result < minimumLoweredSpeed && speed.name !== 'Speed') {
            value.result = minimumLoweredSpeed;
            value.explain += `\nEffects cannot lower a speed below ${ minimumLoweredSpeed }.`;
        }

        value.explain = value.explain.trim();

        return value;
    }

    private _relatives(creature: Creature, name: string, both = false): Array<Effect> {
        if (both && name !== 'Speed') {
            return this._creatureEffectsService.relativeEffectsOnThese(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.relativeEffectsOnThis(creature, name);
        }
    }

    private _absolutes(creature: Creature, name: string, both = false): Array<Effect> {
        if (both && name !== 'Speed') {
            return this._creatureEffectsService.absoluteEffectsOnThese(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.absoluteEffectsOnThis(creature, name);
        }
    }

    private _showBonuses(creature: Creature, name: string, both = false): boolean {
        if (both && name !== 'Speed') {
            return this._creatureEffectsService.doBonusEffectsExistOnThese(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.doBonusEffectsExistOnThis(creature, name);
        }
    }

    private _showPenalties(creature: Creature, name: string, both = false): boolean {
        if (both && name !== 'Speed') {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThese(creature, [name, 'Speed']);
        } else {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThis(creature, name);
        }
    }

    private _baseValue(speed: Speed, creature: Creature): { result: number; explain: string } {
        //Gets the basic speed and adds all effects

        //Get the base speed from the ancestry.
        const baseValue = creature.baseSpeed(speed.name);

        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        const absolutes = this._absolutes(creature, speed.name).filter(effect => effect.setValue);

        absolutes.forEach(effect => {
            baseValue.result = parseInt(effect.setValue, 10);
            baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
        });

        const isNull: boolean = (baseValue.result === 0);

        const relatives = this._relatives(creature, speed.name);

        relatives.forEach(effect => {
            baseValue.result += parseInt(effect.value, 10);
            baseValue.explain += `\n${ effect.source }: ${ effect.value }`;
        });

        //Penalties cannot lower a speed below 5.
        if (!isNull && baseValue.result < minimumLoweredSpeed && speed.name !== 'Speed') {
            baseValue.result = minimumLoweredSpeed;
            baseValue.explain += `\nEffects cannot lower a speed below ${ minimumLoweredSpeed }.`;
        }

        baseValue.explain = baseValue.explain.trim();

        return baseValue;
    }

}
