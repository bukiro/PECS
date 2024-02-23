import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<Background>({
    primitives: [
        'desc',
        'feat',
        'loreName',
        'name',
        'skill',
        'specialLore',
        'subType',
        'subTypes',
        'superType',
        'sourceBook',
        'region',
        'adventurePath',
        'prerequisites',
        'inputRequired',
    ],
    primitiveArrays: [
        'traits',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        featChoices:
            () => obj => FeatChoice.from(obj),
        loreChoices:
            () => obj => LoreChoice.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
    },
});

export class Background implements Serializable<Background> {
    public desc = '';
    public feat = '';
    public loreName = '';
    public name = '';
    public skill = '';
    public specialLore = '';
    public subType = '';
    public subTypes = false;
    public superType = '';
    public sourceBook = '';
    public region = '';
    public adventurePath = '';
    public prerequisites = '';
    public inputRequired = '';

    public traits: Array<string> = [];

    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public loreChoices: Array<LoreChoice> = [];
    public skillChoices: Array<SkillChoice> = [];

    public static from(values: DeepPartial<Background>): Background {
        return new Background().with(values);
    }

    public with(values: DeepPartial<Background>): Background {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Background> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Background {
        return Background.from(this);
    }

    public isEqual(compared: Partial<Background>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
