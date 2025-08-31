import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

const { assign, forExport, isEqual } = setupSerialization<Domain>({
    primitives: [
        'name',
        'desc',
        'domainSpell',
        'advancedDomainSpell',
        'sourceBook',
    ],
});

export class Domain implements Serializable<Domain> {
    public name = '';
    public desc = '';
    public domainSpell = '';
    public advancedDomainSpell = '';
    public sourceBook = '';

    public static from(values: MaybeSerialized<Domain>): Domain {
        return new Domain().with(values);
    }

    public with(values: MaybeSerialized<Domain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Domain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Domain.from(this) as this;
    }

    public isEqual(compared: Partial<Domain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
