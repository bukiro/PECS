import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';

export class Speed {
    constructor(
        public name: string = ''
    ) { }
    public source = '';
    recast() {
        return this;
    }
    relatives(creature: Creature, effectsService: EffectsService, name: string, both = false) {
        if (both && name != 'Speed') {
            return effectsService.get_RelativesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.get_RelativesOnThis(creature, name);
        }
    }
    absolutes(creature: Creature, effectsService: EffectsService, name: string, both = false) {
        if (both && name != 'Speed') {
            return effectsService.get_AbsolutesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.get_AbsolutesOnThis(creature, name);
        }
    }
    bonuses(creature: Creature, effectsService: EffectsService, name: string, both = false) {
        if (both && name != 'Speed') {
            return effectsService.show_BonusesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.show_BonusesOnThis(creature, name);
        }
    }
    penalties(creature: Creature, effectsService: EffectsService, name: string, both = false) {
        if (both && name != 'Speed') {
            return effectsService.show_PenaltiesOnThese(creature, [name, 'Speed']);
        } else {
            return effectsService.show_PenaltiesOnThis(creature, name);
        }
    }
    baseValue(creature: Creature, characterService: CharacterService, effectsService: EffectsService, options: { ignoreRelatives?: boolean } = {}): { result: number; explain: string } {
        //Gets the basic speed and adds all effects
        if (characterService.still_loading()) { return { result: 0, explain: '' }; }
        //Get the base speed from the ancestry.
        const baseValue = creature.get_BaseSpeed(this.name);
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        const absolutes = this.absolutes(creature, effectsService, this.name).filter(effect => effect.setValue);
        absolutes.forEach(effect => {
            baseValue.result = parseInt(effect.setValue);
            baseValue.explain = `${ effect.source }: ${ effect.setValue }`;
        });
        const isNull: boolean = (baseValue.result == 0);
        if (!options.ignoreRelatives) {
            this.relatives(creature, effectsService, this.name).forEach(effect => {
                baseValue.result += parseInt(effect.value);
                baseValue.explain += `\n${ effect.source }: ${ effect.value }`;
            });
        }
        //Penalties cannot lower a speed below 5.
        if (!isNull && baseValue.result < 5 && this.name != 'Speed') {
            baseValue.result = 5;
            baseValue.explain += '\nEffects cannot lower a speed below 5.';
        }
        baseValue.explain = baseValue.explain.trim();
        return baseValue;
    }
    value(creature: Creature, characterService: CharacterService, effectsService: EffectsService): { result: number; explain: string } {
        //If there is a general speed penalty (or bonus), it applies to all speeds. We apply it to the base speed here so we can still
        // copy the base speed for effects (e.g. "You gain a climb speed equal to your land speed") and not apply the general penalty twice.
        const value = this.baseValue(creature, characterService, effectsService);
        const isNull: boolean = (value.result == 0);
        if (this.name != 'Speed') {
            this.relatives(creature, effectsService, 'Speed').forEach(effect => {
                value.result += parseInt(effect.value);
                value.explain += `\n${ effect.source }: ${ effect.value }`;
            });
        }
        if (!isNull && value.result < 5 && this.name != 'Speed') {
            value.result = 5;
            value.explain += '\nEffects cannot lower a speed below 5.';
        }
        value.explain = value.explain.trim();
        return value;
    }
}
