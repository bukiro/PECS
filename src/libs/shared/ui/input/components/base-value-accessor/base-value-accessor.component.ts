import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { forceBooleanFromInput } from 'src/libs/shared/util/componentInputUtils';

@Component({
    selector: 'app-base-value-accessor',
    template: '',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class BaseValueAccessorComponent<T extends string | boolean | number | object> implements ControlValueAccessor {

    @Input()
    public id?: string;

    private _isDisabled = false;

    private _value?: T | null;

    private _onChange?: (value: T | undefined | null) => void;

    private _onTouched?: () => void;

    public get value(): T | undefined | null {
        return this._value;
    }

    public set value(value: T | undefined | null) {
        this._value = value;
        this._onChange?.(value);
    }

    @Input()
    public set disabled(disabled: boolean | string | undefined) {
        this._isDisabled = forceBooleanFromInput(disabled);
    }

    public get disabled(): boolean {
        return this._isDisabled;
    }

    public writeValue(value: T | undefined | null): void {
        this._value = value;
    }

    public registerOnChange(onChange: (value: T | undefined | null) => void): void {
        this._onChange = onChange;
    }

    public registerOnTouched(onTouched: () => void): void {
        this._onTouched = onTouched;
    }

    public setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

}
