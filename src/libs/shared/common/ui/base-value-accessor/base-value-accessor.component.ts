import { booleanAttribute, ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { Uncertain } from '../../util/models/uncertain';
import { v4 as uuidv4 } from 'uuid';

@Component({
    selector: 'app-base-value-accessor',
    template: '',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class BaseValueAccessorComponent<T extends string | boolean | number | object> implements ControlValueAccessor {

    public readonly id$$ = input<string>(uuidv4(), { alias: 'id' });

    public readonly disabled$$ = input(false, { transform: booleanAttribute, alias: 'disabled' });

    public readonly value$$ = model<Uncertain<T>>(null, { alias: 'value' });

    protected _onChange?: (value: Uncertain<T>) => void;

    protected _onTouched?: () => void;

    constructor() {
        effect(() => {
            const value = this.value$$();

            this._onChange?.(value);
        });
    }

    public writeValue(value: Uncertain<T>): void {
        this.value$$.set(value);
    }

    public registerOnChange(onChange: (value: Uncertain<T>) => void): void {
        this._onChange = onChange;
    }

    public registerOnTouched(onTouched: () => void): void {
        this._onTouched = onTouched;
    }

}
