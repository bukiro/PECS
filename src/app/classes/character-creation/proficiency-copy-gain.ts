import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ProficiencyCopyGain>({
    primitives: [
        'name',
        'type',
        'featuresOnly',
        'minLevel',
    ],
});

export class ProficiencyCopyGain implements Serializable<ProficiencyCopyGain> {
    /** Which skill gets to copy proficiency levels? Can include weapon traits, e.g. "Goblin" for goblin weapon proficiency. */
    public name = '';
    /** What type of skill increase gets copied? E.g. "Weapon Proficiency", "Skill"... */
    public type = '';
    /** If featuresOnly is true, skill increases with source "Feat: *" are not copied. */
    public featuresOnly = false;
    /** Minimum skill level needed to apply (usually Trained). */
    public minLevel: SkillLevels = SkillLevels.Trained;

    public static from(values: MaybeSerialized<ProficiencyCopyGain>): ProficiencyCopyGain {
        return new ProficiencyCopyGain().with(values);
    }

    public with(values: MaybeSerialized<ProficiencyCopyGain>): ProficiencyCopyGain {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<ProficiencyCopyGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ProficiencyCopyGain {
        return ProficiencyCopyGain.from(this);
    }

    public isEqual(compared: Partial<ProficiencyCopyGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
