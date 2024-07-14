import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { ItemGain } from '../../items/item-gain';

const { assign, forExport, isEqual } = setupSerialization<Ancestry>({
    primitives: [
        'disabled', 'warning', 'baseLanguages', 'hitPoints', 'name', 'sourceBook', 'size',
    ],
    primitiveArrays: [
        'ancestries', 'heritages', 'languages', 'recommendedLanguages', 'senses', 'traits',
    ],
    primitiveObjectArrays: [
        'desc', 'speeds',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
    },
});

export class Ancestry implements Serializable<Ancestry> {
    public disabled = '';
    public warning = '';
    public baseLanguages = 0;
    public hitPoints = 0;
    public name = '';
    public sourceBook = '';
    public size = 0;

    public ancestries: Array<string> = [];
    public heritages: Array<string> = [];
    public languages: Array<string> = [];
    public recommendedLanguages: Array<string> = [];
    public senses: Array<string> = [];

    public desc: Array<{ name: string; value: string }> = [];
    public speeds: Array<{ name: string; value: number }> = [];

    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public gainItems: Array<ItemGain> = [];

    private readonly _traits = new OnChangeArray<string>();

    public get traits(): OnChangeArray<string> {
        return this._traits;
    }

    public set traits(value: Array<string>) {
        this._traits.setValues(...value);
    }

    public static from(values: DeepPartial<Ancestry>): Ancestry {
        return new Ancestry().with(values);
    }

    public with(values: DeepPartial<Ancestry>): Ancestry {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Ancestry> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Ancestry {
        return Ancestry.from(this);
    }

    public isEqual(compared: Partial<Ancestry>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
