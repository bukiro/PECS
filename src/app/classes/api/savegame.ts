import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/definitions/interfaces/serializable';
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

    public static from(values: MaybeSerialized<Savegame> & { id: string }): Savegame {
        return new Savegame(values.id).with(values);
    }

    public with(values: MaybeSerialized<Savegame>): Savegame {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Savegame> {
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
