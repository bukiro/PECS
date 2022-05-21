import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from './Effect';

const minimumLoweredSpeed = 5;

export class Speed {
    public source = '';
    constructor(
        public name: string = '',
    ) { }
    public recast(): Speed {
        return this;
    }
    public relatives(creature: Creature, effectsService: EffectsService, name: string, both = false): Array<Effect> {
        if (both && name !== 'Speed') {
            return effectsService.get_RelativesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.get_RelativesOnThis(creature, name);
        }
    }
    public absolutes(creature: Creature, effectsService: EffectsService, name: string, both = false): Array<Effect> {
        if (both && name !== 'Speed') {
            return effectsService.get_AbsolutesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.get_AbsolutesOnThis(creature, name);
        }
    }
    public showBonuses(creature: Creature, effectsService: EffectsService, name: string, both = false): boolean {
        if (both && name !== 'Speed') {
            return effectsService.show_BonusesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.show_BonusesOnThis(creature, name);
        }
    }
    public showPenalties(creature: Creature, effectsService: EffectsService, name: string, both = false): boolean {
        if (both && name !== 'Speed') {
            return effectsService.show_PenaltiesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.show_PenaltiesOnThis(creature, name);
        }
    }
    public baseValue(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
        options: { ignoreRelatives?: boolean } = {},
    ): { result: number; explain: string } {
        //Gets the basic speed and adds all effects
        if (characterService.stillLoading) { return { result: 0, explain: '' }; }

        //Get the base speed from the ancestry.
        const baseValue = creature.baseSpeed(this.name);
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        const absolutes = this.absolutes(creature, effectsService, this.name).filter(effect => effect.setValue);

        absolutes.forEach(effect => {
            baseValue.result = parseInt(effect.setValue, 10);
            baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
        });

        const isNull: boolean = (baseValue.result === 0);

        if (!options.ignoreRelatives) {
            this.relatives(creature, effectsService, this.name).forEach(effect => {
                baseValue.result += parseInt(effect.value, 10);
                baseValue.explain += `\n${ effect.source }: ${ effect.value }`;
            });
        }

        //Penalties cannot lower a speed below 5.
        if (!isNull && baseValue.result < minimumLoweredSpeed && this.name !== 'Speed') {
            baseValue.result = minimumLoweredSpeed;
            baseValue.explain += `\nEffects cannot lower a speed below ${ minimumLoweredSpeed }.`;
        }

        baseValue.explain = baseValue.explain.trim();

        return baseValue;
    }
    public value(
        creature: Creature,
        characterService: CharacterService,
        effectsService: EffectsService,
    ): { result: number; explain: string } {
        //If there is a general speed penalty (or bonus), it applies to all speeds. We apply it to the base speed here so we can still
        // copy the base speed for effects (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
        const value = this.baseValue(creature, characterService, effectsService);
        const isNull: boolean = (value.result === 0);

        if (this.name !== 'Speed') {
            this.relatives(creature, effectsService, 'Speed').forEach(effect => {
                value.result += parseInt(effect.value, 10);
                value.explain += `\n${ effect.source }: ${ effect.value }`;
            });
        }

        if (!isNull && value.result < minimumLoweredSpeed && this.name !== 'Speed') {
            value.result = minimumLoweredSpeed;
            value.explain += `\nEffects cannot lower a speed below ${ minimumLoweredSpeed }.`;
        }

        value.explain = value.explain.trim();

        return value;
    }
}
