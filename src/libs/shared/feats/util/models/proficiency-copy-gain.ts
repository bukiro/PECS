import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { SkillLevels } from 'src/libs/shared/skills/util/models/skill-levels';

const { assign, forExport, isEqual } = setupSerialization<ProficiencyCopyGain>({
    primitives: [
        'name',
        'type',
        'featuresOnly',
        'minLevel',
    ],
});

/**
 * A proficiency copy means that the trait designated by name (or trait), if it has at least the given skill level,
 * gets treated as if it had the highest available proficiency of the given type.
 * This is evaluated in a context of feats and features (or only features) and ignores current effects.
 *
 * Usually, this is about weapons with traits (like "Elf" or "Monk") and only respects class features, not feats.
 */
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

    public with(values: MaybeSerialized<ProficiencyCopyGain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<ProficiencyCopyGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return ProficiencyCopyGain.from(this) as this;
    }

    public isEqual(compared: Partial<ProficiencyCopyGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
