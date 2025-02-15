import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { SkillChoice } from '../../character-creation/skill-choice';

const { assign, forExport, isEqual } = setupSerialization<AnimalCompanionLevel>({
    primitives: [
        'extraDamage', 'name', 'number', 'sizeChange', 'sourceBook',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
    },
});

export class AnimalCompanionLevel implements Serializable<AnimalCompanionLevel> {
    public extraDamage = 0;
    public name = '';
    public number = 0;
    public sizeChange = 0;
    public sourceBook = '';

    public abilityChoices: Array<AbilityChoice> = [];
    public skillChoices: Array<SkillChoice> = [];

    public static from(values: MaybeSerialized<AnimalCompanionLevel>): AnimalCompanionLevel {
        return new AnimalCompanionLevel().with(values);
    }

    public with(values: MaybeSerialized<AnimalCompanionLevel>): AnimalCompanionLevel {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AnimalCompanionLevel> {
        return {
            ...forExport(this),
        };
    }

    public clone(): AnimalCompanionLevel {
        return AnimalCompanionLevel.from(this);
    }

    public isEqual(compared: Partial<AnimalCompanionLevel>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
