import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { SkillChoice } from '../../character-creation/skill-choice';
import { EffectGain } from '../../effects/effect-gain';
import { Hint } from '../../hints/hint';

const { assign, forExport, isEqual } = setupSerialization<AnimalCompanionSpecialization>({
    primitives: [
        'desc', 'level', 'name', 'sourceBook',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        effects:
            () => obj => EffectGain.from(obj),
        hints:
            () => obj => Hint.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
    },
});

export class AnimalCompanionSpecialization implements Serializable<AnimalCompanionSpecialization> {
    public desc = '';
    public level = 0;
    public name = '';
    public sourceBook = '';

    public abilityChoices: Array<AbilityChoice> = [];
    public effects: Array<EffectGain> = [];
    public hints: Array<Hint> = [];
    public skillChoices: Array<SkillChoice> = [];

    public static from(values: DeepPartial<AnimalCompanionSpecialization>): AnimalCompanionSpecialization {
        return new AnimalCompanionSpecialization().with(values);
    }

    public with(values: DeepPartial<AnimalCompanionSpecialization>): AnimalCompanionSpecialization {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AnimalCompanionSpecialization> {
        return {
            ...forExport(this),
        };
    }

    public clone(): AnimalCompanionSpecialization {
        return AnimalCompanionSpecialization.from(this);
    }

    public isEqual(compared: Partial<AnimalCompanionSpecialization>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
