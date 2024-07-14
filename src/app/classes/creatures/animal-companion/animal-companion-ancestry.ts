import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ActivityGain } from '../../activities/activity-gain';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { SkillChoice } from '../../character-creation/skill-choice';
import { Hint } from '../../hints/hint';
import { ItemGain } from '../../items/item-gain';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<AnimalCompanionAncestry>({
    primitives: [
        'desc', 'hitPoints', 'name', 'size', 'sourceBook', 'specialdesc', 'supportBenefit',
    ],
    primitiveArrays: [
        'senses', 'traits',
    ],
    primitiveObjectArrays: [
        'speeds',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        activities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity(obj),
            }),
        hints:
            () => obj => Hint.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
    },
});

export class AnimalCompanionAncestry implements Serializable<AnimalCompanionAncestry> {
    public desc = '';
    public hitPoints = 0;
    public name = '';
    public size = 0;
    public sourceBook = '';
    public specialdesc = '';
    public supportBenefit = '';

    public senses: Array<string> = [];
    public traits: Array<string> = [];

    public speeds: Array<{ name: string; value: number }> = [];

    public abilityChoices: Array<AbilityChoice> = [];
    public activities: Array<ActivityGain> = [];
    public hints: Array<Hint> = [];
    public gainItems: Array<ItemGain> = [];
    public skillChoices: Array<SkillChoice> = [];

    public static from(values: DeepPartial<AnimalCompanionAncestry>, recastFns: RecastFns): AnimalCompanionAncestry {
        return new AnimalCompanionAncestry().with(values, recastFns);
    }

    public with(values: DeepPartial<AnimalCompanionAncestry>, recastFns: RecastFns): AnimalCompanionAncestry {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<AnimalCompanionAncestry> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): AnimalCompanionAncestry {
        return AnimalCompanionAncestry.from(this, recastFns);
    }

    public isEqual(compared: Partial<AnimalCompanionAncestry>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
