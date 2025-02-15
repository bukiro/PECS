import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { SpellCast } from '../spells/spell-cast';

const { assign, forExport, isEqual } = setupSerialization<Deity>({
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
            () => obj => SpellCast.from(obj),
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

    public static from(values: MaybeSerialized<Deity>): Deity {
        return new Deity().with(values);
    }

    public with(values: MaybeSerialized<Deity>): Deity {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Deity> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Deity {
        return Deity.from(this);
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
