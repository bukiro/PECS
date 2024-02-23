import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Hint } from 'src/app/classes/Hint';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

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
