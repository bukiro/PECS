import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { SkillIncrease } from '../skills/skill-increase';
import { SkillChoice } from './skill-choice';

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

    public increases: Array<SkillIncrease> = [];

    public static from(values: MaybeSerialized<LoreChoice>): LoreChoice {
        return new LoreChoice().with(values);
    }

    public with(values: MaybeSerialized<LoreChoice>): LoreChoice {
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

    public clone(): LoreChoice {
        return LoreChoice.from(this);
    }

    public isEqual(compared: Partial<LoreChoice>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isLoreChoice(): this is LoreChoice {
        return true;
    }
}
