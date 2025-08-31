import { AbilityChoice } from 'src/libs/shared/abilities/util/models/ability-choice';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { Hint } from 'src/libs/shared/hints/util/models/hint';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';
import { Speed } from 'src/libs/shared/speed/util/models/speed';


const { assign, forExport, isEqual } = setupSerializationWithHelpers<AnimalCompanionAncestry>({
    primitives: [
        'desc', 'hitPoints', 'name', 'size', 'sourceBook', 'specialdesc', 'supportBenefit',
    ],
    primitiveArrays: [
        'senses', 'traits',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        activities:
            recastFns => obj => ActivityGain.from(obj, recastFns),
        hints:
            () => obj => Hint.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
        speeds:
            () => obj => Speed.from({ ...obj, source: obj.source ?? 'Ancestry' }),
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

    public speeds: Array<Speed> = [];

    public activities: Array<ActivityGain> = [];
    public hints: Array<Hint> = [];
    public gainItems: Array<ItemGain> = [];

    public abilityChoices = Array<AbilityChoice>();
    public skillChoices = Array<SkillChoice>();

    public static from(values: MaybeSerialized<AnimalCompanionAncestry>, recastFns: RecastFns): AnimalCompanionAncestry {
        return new AnimalCompanionAncestry().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AnimalCompanionAncestry>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<AnimalCompanionAncestry> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return AnimalCompanionAncestry.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AnimalCompanionAncestry>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
