import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';

const { assign, forExport, isEqual } = setupSerialization<LoreChoice>({
    primitives: [
        'available',
        'id',
        'initialIncreases',
        'loreDesc',
        'loreName',
        'maxRank',
        'source',
    ],
    primitiveObjectArrays: [
        'increases',
    ],
});

export class LoreChoice extends SkillChoice implements Serializable<LoreChoice> {
    public available = 0;
    public id = '';
    public initialIncreases = 1;
    public loreDesc = '';
    public loreName = '';
    public maxRank = 0;

    public static from(values: MaybeSerialized<LoreChoice>): LoreChoice {
        return new LoreChoice().with(values);
    }

    public with(values: MaybeSerialized<LoreChoice>): this {
        super.with(values);

        assign(this, values);

        return this;
    }

    public forExport(): Serialized<LoreChoice> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(): this {
        return LoreChoice.from(this) as this;
    }

    public isEqual(compared: Partial<LoreChoice>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isLoreChoice(): this is LoreChoice {
        return true;
    }
}
