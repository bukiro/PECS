import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, input, model } from '@angular/core';
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

    public readonly activeLabel$$ = input<string | undefined>(undefined, { alias: 'activeLabel' });

    public readonly inactiveLabel$$ = input<string | undefined>(undefined, { alias: 'inactiveLabel' });

    public readonly value$$ = model<boolean>(false, { alias: 'value' });

    public readonly currentLabel$$ = computed(() => (this.value$$() ? this.activeLabel$$() : this.inactiveLabel$$()) ?? this.label$$());

    private _onChange?: (value: boolean) => void;

    private _onTouched?: () => void;

    constructor() {
        super();

        effect(() => {
            const isToggled = this.value$$();

            this._onChange?.(isToggled);
        });
    }

    public toggle(): void {
        this.value$$.update(value => !value);
    }

    public writeValue(value: boolean): void {
        this.value$$.set(value);
    }

    public registerOnChange(fn: (value: boolean) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

}
