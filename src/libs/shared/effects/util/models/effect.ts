import { v4 as uuidv4 } from 'uuid';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { BonusTypes } from './bonus-types';
import { signNumber } from 'src/libs/shared/common/util/utils/number-utils';

const { assign, forExport, isEqual } = setupSerialization<Effect>({
    primitives: [
        'applied',
        'creature',
        'fromEvolution',
        'displayed',
        'duration',
        'id',
        'ignored',
        'invertPenalty',
        'maxDuration',
        'source',
        'sourceId',
        'setValueNumerical',
        'target',
        'title',
        'toggled',
        'type',
        'valueNumerical',
    ],
    primitiveArrays: [
        'cumulative',
    ],
});

export type AbsoluteEffect = Effect & { setValueNumerical: number };
export type RelativeEffect = Effect & { valueNumerical: number };
export type ToggledEffect = Effect & { toggled: number };

export class Effect implements Serializable<Effect> {
    public applied?: boolean;
    public creature = '';
    public fromEvolution?: boolean;
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
    public type: BonusTypes = 'untyped';
    public valueNumerical = 0;

    /** If the effect has a type, cumulative lists all effect sources (of the same type) that it is cumulative with. */
    public cumulative: Array<string> = [];

    constructor(
        value: number = 0,
        setValue: number | null = null,
    ) {
        this.valueNumerical = value;
        this.setValueNumerical = setValue;
    }

    public get penalty(): boolean {
        return !!this.invertPenalty !== (this.valueNumerical < 0);
    }

    public get hasSetValue(): boolean {
        return this.setValueNumerical !== null;
    }

    public get hasValue(): boolean {
        return this.valueNumerical !== 0;
    }

    public static from(values: MaybeSerialized<Effect>): Effect {
        return new Effect().with(values);
    }

    public with(values: MaybeSerialized<Effect>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Effect> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Effect.from(this) as this;
    }

    public isEqual(compared: Partial<Effect>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public isAbsoluteEffect(): this is AbsoluteEffect {
        return this.hasSetValue;
    }

    public isRelativeEffect(): this is RelativeEffect {
        return !this.hasSetValue && this.hasValue;
    }

    public isToggledEffect(): this is ToggledEffect {
        return !!this.toggled;
    }

    public displayTitle(signed = false): string {
        const equals = signed ? '= ' : '';

        if (this.title) {
            return `${ equals }${ this.title }`;
        } else {
            if (this.valueNumerical) {
                return signNumber(this.valueNumerical);
            } else if (this.setValueNumerical !== null) {
                return `${ equals }${ this.setValueNumerical }`;
            } else {
                return '';
            }
        }
    }
}
