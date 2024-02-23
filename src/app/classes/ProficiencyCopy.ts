import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ProficiencyCopy>({
    primitives: [
        'name',
        'type',
        'featuresOnly',
        'minLevel',
    ],
});

export class ProficiencyCopy implements Serializable<ProficiencyCopy> {
    /** Which skill gets to copy proficiency levels? Can include weapon traits, e.g. "Goblin" for goblin weapon proficiency. */
    public name = '';
    /** What type of skill increase gets copied? E.g. "Weapon Proficiency", "Skill"... */
    public type = '';
    /** If featuresOnly is true, skill increases with source "Feat: *" are not copied. */
    public featuresOnly = false;
    /** Minimum skill level needed to apply (usually Trained). */
    public minLevel: SkillLevels = SkillLevels.Trained;

    public static from(values: DeepPartial<ProficiencyCopy>): ProficiencyCopy {
        return new ProficiencyCopy().with(values);
    }

    public with(values: DeepPartial<ProficiencyCopy>): ProficiencyCopy {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ProficiencyCopy> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ProficiencyCopy {
        return ProficiencyCopy.from(this);
    }

    public isEqual(compared: Partial<ProficiencyCopy>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
