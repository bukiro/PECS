import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { maxSkillLevel } from 'src/libs/shared/definitions/skillLevels';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { SkillIncrease } from '../skills/skill-increase';

const { assign, forExport, isEqual } = setupSerialization<SkillChoice>({
    primitives: [
        'available',
        'bonus',
        'id',
        'insertLevel',
        'insertClass',
        'minRank',
        'maxRank',
        'showOnSheet',
        'source',
        'type',
    ],
    primitiveArrays: [
        'filter',
    ],
    primitiveObjectArrays: [
        'increases',
    ],
});

export class SkillChoice implements Serializable<SkillChoice> {
    public available = 0;
    public bonus = false;
    public id = '';
    /**
     * If insertLevel is set, this SkillChoice is placed at the designated class level when granted by a feat.
     * I.e. if a feat contains a SkillChoice with insertLevel = 5, the choice is added to level 5 regardless of when the feat was taken.
     */
    public insertLevel = 0;
    /**
     * If insertClass is set, this SkillChoice is only granted by a feat if the character class name matches this name.
     * This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.)
     * that don't give certain benefits when multiclassing.
     */
    public insertClass = '';
    /**
     * minRank: you may only increase skills that already have at least this level.
     * If a skill increase doesn't come from at least one choice with minRank == 0, it isn't counted at all.
     * This allows to upgrade, but not learn skills (like spell DCs for traditions you haven't chosen).
     */
    public minRank = 0;
    /**
     * maxRank: the highest rank you are allowed to achieve with this choice.
     * This means that only skills are allowed which currently have maxRank-2 !
     */
    public maxRank = maxSkillLevel;
    /**
     * If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
     * This is relevant for feats like Ancestral Longevity.
     */
    public showOnSheet = false;
    public source = '';
    public type = '';

    public filter: Array<string> = [];

    public increases: Array<SkillIncrease> = [];

    public static from(values: DeepPartial<SkillChoice>): SkillChoice {
        return new SkillChoice().with(values);
    }

    public with(values: DeepPartial<SkillChoice>): SkillChoice {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SkillChoice> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SkillChoice {
        return SkillChoice.from(this);
    }

    public isEqual(compared: Partial<SkillChoice>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
