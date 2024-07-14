import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<SpecializationGain>({
    primitives: [
        'minLevel',
        'bladeAlly',
        'favoredWeapon',
        'condition',
        'featreq',
        'group',
        'name',
        'proficiency',
        'skillLevel',
        'range',
        'trait',
    ],
});

export class SpecializationGain implements Serializable<SpecializationGain> {
    public minLevel = SkillLevels.Untrained;
    public bladeAlly = false;
    public favoredWeapon = false;
    public condition = '';
    public featreq = '';
    public group = '';
    public name = '';
    public proficiency = '';
    public skillLevel = SkillLevels.Untrained;
    public range = '';
    public trait = '';

    public static from(values: DeepPartial<SpecializationGain>): SpecializationGain {
        return new SpecializationGain().with(values);
    }

    public with(values: DeepPartial<SpecializationGain>): SpecializationGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SpecializationGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpecializationGain {
        return SpecializationGain.from(this);
    }

    public isEqual(compared: Partial<SpecializationGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
