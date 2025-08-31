import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { SkillLevels } from 'src/libs/shared/skills/util/models/skill-levels';

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

    public static from(values: MaybeSerialized<SpecializationGain>): SpecializationGain {
        return new SpecializationGain().with(values);
    }

    public with(values: MaybeSerialized<SpecializationGain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SpecializationGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return SpecializationGain.from(this) as this;
    }

    public isEqual(compared: Partial<SpecializationGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
