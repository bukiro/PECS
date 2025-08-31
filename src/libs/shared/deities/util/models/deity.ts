import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { SpellCast } from '../../../spells/util/models/spell-cast';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Deity>({
    primitives: [
        'name',
        'nickname',
        'desc',
        'sourceBook',
        'areasOfConcern',
        'category',
        'alignment',
    ],
    primitiveArrays: [
        'edicts',
        'anathema',
        'pantheonMembers',
        'followerAlignments',
        'divineAbility',
        'divineFont',
        'divineSkill',
        'favoredWeapon',
        'domains',
        'alternateDomains',
    ],
    serializableArrays: {
        clericSpells:
            recastFns => obj => SpellCast.from(obj, recastFns),
    },
});

export class Deity implements Serializable<Deity> {
    public name = '';
    public nickname = '';
    public desc = '';
    public sourceBook = '';
    public areasOfConcern = '';
    public category = '';
    public alignment = '';

    public edicts: Array<string> = [];
    public anathema: Array<string> = [];
    public pantheonMembers: Array<string> = [];
    public followerAlignments: Array<string> = [];
    public divineAbility: Array<string> = [];
    public divineFont: Array<'Heal' | 'Harm'> = [];
    public divineSkill: Array<string> = [];
    public favoredWeapon: Array<string> = [];
    public domains: Array<string> = [];
    public alternateDomains: Array<string> = [];

    public clericSpells: Array<SpellCast> = [];

    public static from(values: MaybeSerialized<Deity>, recastFns: RecastFns): Deity {
        return new Deity().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Deity>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Deity> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return Deity.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Deity>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public isDomainExternal(domain: string): boolean {
        return !new Set([
            ...this.domains,
            ...this.alternateDomains,
        ]).has(domain);
    }
}
