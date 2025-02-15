import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { SkillChoice } from '../../character-creation/skill-choice';
import { SpellChoice } from '../../character-creation/spell-choice';
import { ItemGain } from '../../items/item-gain';

const { assign, forExport, isEqual } = setupSerialization<Heritage>({
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
            () => obj => FeatChoice.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
        spellChoices:
            () => obj => SpellChoice.from(obj),
        subTypes:
            () => obj => Heritage.from(obj),
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

    public static from(values: MaybeSerialized<Heritage>): Heritage {
        return new Heritage().with(values);
    }

    public with(values: MaybeSerialized<Heritage>): Heritage {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Heritage> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Heritage {
        return Heritage.from(this);
    }

    public isEqual(compared: Partial<Heritage>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
