import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

const { assign, forExport } = setupSerialization<Heritage>({
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

    public static from(values: DeepPartial<Heritage>): Heritage {
        return new Heritage().with(values);
    }

    public with(values: DeepPartial<Heritage>): Heritage {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Heritage> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Heritage {
        return Heritage.from(this);
    }
}
