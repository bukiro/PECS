import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

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

    public with(values: MaybeSerialized<LanguageGain>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<LanguageGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return LanguageGain.from(this) as this;
    }

    public isEqual(compared: Partial<LanguageGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
