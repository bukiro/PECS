import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';
import { SpellChoice } from 'src/libs/shared/spells/util/models/spell-choice';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Heritage>({
    primitives: [
        'desc',
        'displayOnly',
        'name',
        'sourceBook',
        'subType',
        'superType',
    ],
    primitiveArrays: [
        'gainActivities',
        'ancestries',
        'senses',
        'traits',
    ],
    serializableArrays: {
        featChoices:
            recastFns => obj => FeatChoice.from(obj, recastFns),
        gainItems:
            () => obj => ItemGain.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
        spellChoices:
            recastFns => obj => SpellChoice.from(obj, recastFns),
        subTypes:
            recastFns => obj => Heritage.from(obj, recastFns),
    },
});

export class Heritage implements Serializable<Heritage> {
    public desc = '';
    public displayOnly = false;
    public name = '';
    public sourceBook = '';
    public subType = '';
    public superType = '';

    public gainActivities: Array<string> = [];
    public ancestries: Array<string> = [];
    public senses: Array<string> = [];
    public traits: Array<string> = [];

    public featChoices: Array<FeatChoice> = [];
    public gainItems: Array<ItemGain> = [];
    public skillChoices: Array<SkillChoice> = [];
    public spellChoices: Array<SpellChoice> = [];
    public subTypes: Array<Heritage> = [];

    public static from(values: MaybeSerialized<Heritage>, recastFns: RecastFns): Heritage {
        return new Heritage().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Heritage>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Heritage> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Heritage.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Heritage>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
