import { AbilityChoice } from 'src/libs/shared/abilities/util/models/ability-choice';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { LoreChoice } from 'src/libs/shared/lores/util/models/lore-choice';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Background>({
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
            recastFns => obj => FeatChoice.from(obj, recastFns),
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

    public static from(values: MaybeSerialized<Background>, recastFns: RecastFns): Background {
        return new Background().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Background>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Background> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Background.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Background>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
