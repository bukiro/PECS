import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<Savegame>({
    primitives: [
        'name',
        'dbId',
        'class',
        'classChoice',
        'heritage',
        'ancestry',
        'level',
        'partyName',
        'companionName',
        'companionId',
        'familiarName',
        'familiarId',
    ],
});

export class Savegame implements Serializable<Savegame> {
    public name = 'Unnamed';
    public dbId?: string;
    public class?: string;
    public classChoice?: string;
    public heritage?: string;
    public ancestry?: string;
    public level?: number;
    public partyName = 'No Party';
    public companionName?: string;
    public companionId?: string;
    public familiarName?: string;
    public familiarId?: string;

    constructor(public id: string) { }

    public static from(values: DeepPartial<Savegame> & { id: string }): Savegame {
        return new Savegame(values.id).with(values);
    }

    public with(values: DeepPartial<Savegame>): Savegame {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Savegame> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Savegame {
        return Savegame.from(this);
    }

    public isEqual(compared: Partial<Savegame>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
