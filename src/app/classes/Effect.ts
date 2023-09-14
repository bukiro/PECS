import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';
import { v4 as uuidv4 } from 'uuid';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<Effect>({
    primitives: [
        'applied',
        'creature',
        'displayed',
        'duration',
        'id',
        'ignored',
        'invertPenalty',
        'maxDuration',
        'source',
        'sourceId',
        'setValue',
        'setValueNumerical',
        'target',
        'title',
        'toggled',
        'type',
        'value',
        'valueNumerical',
    ],
    primitiveArrays: [
        'cumulative',
    ],
});

export type AbsoluteEffect = Effect & { setValueNumerical: number };
export type RelativeEffect = Effect & { valueNumerical: number };

export class Effect implements Serializable<Effect> {
    public applied?: boolean;
    public creature = '';
    public displayed?: boolean;
    public duration = 0;
    public id = uuidv4();
    public ignored = false;
    public invertPenalty?: boolean;
    public maxDuration = 0;
    public source = '';
    public sourceId = '';
    public setValueNumerical: number | null = null;
    public target = '';
    public title = '';
    public toggled?: boolean;
    public type: BonusTypes = BonusTypes.Untyped;
    public valueNumerical = 0;

    /** If the effect has a type, cumulative lists all effect sources (of the same type) that it is cumulative with. */
    public cumulative: Array<string> = [];

    private _value = '';
    private _setValue = '';
    constructor(
        value: string = '',
        setValue: string = '',
    ) {
        this.value = value;
        this.setValue = setValue;
    }

    public set value(value: string) {
        const valueNumerical = parseInt(value, 10);

        if (value && !isNaN(valueNumerical)) {
            this._value = (valueNumerical >= 0 ? '+' : '') + valueNumerical;
            this.valueNumerical = valueNumerical;
        } else {
            this._value = '';
            this.valueNumerical = 0;
        }
    }

    public get value(): string {
        return this._value;
    }

    public set setValue(setValue: string) {
        this._setValue = setValue;

        const setValueNumerical = parseInt(setValue, 10);

        if (setValue && !isNaN(setValueNumerical)) {
            this.setValueNumerical = setValueNumerical;
        } else {
            this.setValueNumerical = null;
        }
    }

    public get setValue(): string {
        return this._setValue;
    }

    public get penalty(): boolean {
        return this.invertPenalty !== (this.valueNumerical < 0);
    }

    public get hasSetValue(): boolean {
        return this.setValueNumerical !== null;
    }

    public get hasValue(): boolean {
        return this.valueNumerical !== 0;
    }

    public static from(values: DeepPartial<Effect>): Effect {
        return new Effect().with(values);
    }

    public with(values: DeepPartial<Effect>): Effect {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Effect> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Effect {
        return Effect.from(this);
    }

    public isAbsoluteEffect(): this is AbsoluteEffect {
        return this.hasSetValue;
    }

    public isRelativeEffect(): this is RelativeEffect {
        return !this.hasSetValue && this.hasValue;
    }

    public displayTitle(signed = false): string {
        if (this.title) {
            return (signed ? '= ' : '') + this.title;
        } else {
            if (parseInt(this.value, 10)) {
                return this.value;
            } else if (this.setValue) {
                return (signed ? '= ' : '') + this.setValue;
            } else {
                return '';
            }
        }
    }
}
