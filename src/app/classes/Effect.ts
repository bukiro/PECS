import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';
import { v4 as uuidv4 } from 'uuid';

export type AbsoluteEffect = Effect & { setValueNumerical: number };
export type RelativeEffect = Effect & { valueNumerical: number };

export class Effect {
    public id = uuidv4();
    public ignored = false;
    public creature = '';
    public type: BonusTypes = BonusTypes.Untyped;
    public target = '';
    public title = '';
    public source = '';
    public invertPenalty?: boolean;
    public toggled?: boolean;
    public applied?: boolean;
    public displayed?: boolean;
    public duration = 0;
    public maxDuration = 0;
    /** If the effect has a type, cumulative lists all effect sources (of the same type) that it is cumulative with. */
    public cumulative: Array<string> = [];
    public sourceId = '';
    public valueNumerical = 0;
    public setValueNumerical: number | null = null;

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
        const setValueNumerical = parseInt(setValue, 10);

        this._setValue = setValue;

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

    public static from(partial: Partial<Effect>): Effect {
        return Object.assign<Effect, Partial<Effect>>(new Effect(), partial).recast();
    }

    public isAbsoluteEffect(): this is AbsoluteEffect {
        return this.hasSetValue;
    }

    public isRelativeEffect(): this is RelativeEffect {
        return !this.hasSetValue && this.hasValue;
    }

    public recast(): Effect {
        return this;
    }

    public clone(): Effect {
        return Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(this))).recast();
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
