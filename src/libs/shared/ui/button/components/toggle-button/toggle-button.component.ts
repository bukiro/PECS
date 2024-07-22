import { ChangeDetectionStrategy, Component, Input, computed, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
    selector: 'app-toggle-button',
    templateUrl: './toggle-button.component.html',
    styleUrls: ['./toggle-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ButtonComponent,
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ToggleButtonComponent),
            multi: true,
        },
    ],
})
export class ToggleButtonComponent extends ButtonComponent implements ControlValueAccessor {

    @Input()
    public activeLabel?: string;

    @Input()
    public inactiveLabel?: string;

    public readonly currentLabel = computed(() => (this._isToggled() ? this.activeLabel : this.inactiveLabel) ?? this.label);

    private readonly _isToggled = signal(false);

    private _onChange?: (value: boolean) => void;

    private _onTouched?: () => void;

    private _value = false;

    public get value(): boolean {
        return this._value;
    }

    public set value(value: boolean) {
        this.toggled = value;
        this._isToggled.set(value);
        this._value = value;
        this._onChange?.(value);
    }

    public writeValue(value: boolean): void {
        this.toggled = value;
        this._isToggled.set(value);
        this._value = value;
    }

    public registerOnChange(fn: (value: boolean) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

}
