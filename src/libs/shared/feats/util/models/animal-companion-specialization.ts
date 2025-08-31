import { AbilityChoice } from 'src/libs/shared/abilities/util/models/ability-choice';
import { EffectGain } from 'src/libs/shared/effects/util/models/effect-gain';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';

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

    public static from(values: MaybeSerialized<AnimalCompanionSpecialization>): AnimalCompanionSpecialization {
        return new AnimalCompanionSpecialization().with(values);
    }

    public with(values: MaybeSerialized<AnimalCompanionSpecialization>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AnimalCompanionSpecialization> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return AnimalCompanionSpecialization.from(this) as this;
    }

    public isEqual(compared: Partial<AnimalCompanionSpecialization>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
