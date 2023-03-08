import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-toggle-button',
    templateUrl: './toggle-button.component.html',
    styleUrls: ['./toggle-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: ToggleButtonComponent,
            multi: true,
        },
    ],
})
export class ToggleButtonComponent extends ButtonComponent implements ControlValueAccessor {

    private _onChange?: (value: boolean) => void;

    private _onTouched?: () => void;

    private _value = false;

    public get value(): boolean {
        return this._value;
    }

    public set value(value: boolean) {
        this.toggled = value;
        this._value = value;
        this._onChange?.(value);
    }

    public writeValue(value: boolean): void {
        this.value = value;
    }

    public registerOnChange(fn: (value: boolean) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

}
