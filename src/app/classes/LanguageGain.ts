import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<LanguageGain>({
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

    public static from(values: DeepPartial<LanguageGain>): LanguageGain {
        return new LanguageGain().with(values);
    }

    public with(values: DeepPartial<LanguageGain>): LanguageGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<LanguageGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): LanguageGain {
        return LanguageGain.from(this);
    }
}
