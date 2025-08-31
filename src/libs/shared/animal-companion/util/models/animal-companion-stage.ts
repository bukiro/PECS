import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { AbilityChoice } from '../../../abilities/util/models/ability-choice';
import { SkillChoice } from '../../../skills/util/models/skill-choice';

const { assign, forExport, isEqual } = setupSerialization<AnimalCompanionStage>({
    primitives: [
        'extraDamage', 'name', 'stage', 'sizeChange', 'sourceBook',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
    },
});

export class AnimalCompanionStage implements Serializable<AnimalCompanionStage> {
    public extraDamage = 0;
    public name = '';
    public stage = 0;
    public sizeChange = 0;
    public sourceBook = '';

    public abilityChoices = Array<AbilityChoice>();
    public skillChoices = Array<SkillChoice>();

    public static from(values: MaybeSerialized<AnimalCompanionStage>): AnimalCompanionStage {
        return new AnimalCompanionStage().with(values);
    }

    public with(values: MaybeSerialized<AnimalCompanionStage>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AnimalCompanionStage> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return AnimalCompanionStage.from(this) as this;
    }

    public isEqual(compared: Partial<AnimalCompanionStage>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
