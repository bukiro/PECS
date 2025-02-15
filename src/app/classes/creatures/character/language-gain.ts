import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<LanguageGain>({
    primitives: [
        'name',
        'source',
        'title',
        'locked',
        'level',
    ],
});

export class LanguageGain implements Serializable<LanguageGain> {
    public name = '';
    public source = '';
    public title = 'Granted language';
    public locked = false;
    public level = -1;

    public static from(values: MaybeSerialized<LanguageGain>): LanguageGain {
        return new LanguageGain().with(values);
    }

    public with(values: MaybeSerialized<LanguageGain>): LanguageGain {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<LanguageGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): LanguageGain {
        return LanguageGain.from(this);
    }

    public isEqual(compared: Partial<LanguageGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
