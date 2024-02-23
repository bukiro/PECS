import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

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

    public static from(values: DeepPartial<Domain>): Domain {
        return new Domain().with(values);
    }

    public with(values: DeepPartial<Domain>): Domain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Domain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Domain {
        return Domain.from(this);
    }

    public isEqual(compared: Partial<Domain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
