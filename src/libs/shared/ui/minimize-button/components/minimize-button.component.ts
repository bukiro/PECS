import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-minimize-button',
    templateUrl: './minimize-button.component.html',
    styleUrls: ['./minimize-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: MinimizeButtonComponent,
            multi: true,
        },
    ],
})
export class MinimizeButtonComponent implements ControlValueAccessor {

    private _onChange?: (value: boolean) => void;

    private _onTouched?: () => void;

    private _isMinimized = false;

    public get isMinimized(): boolean {
        return this._isMinimized;
    }

    public set isMinimized(value: boolean) {
        this._isMinimized = value;
        this._onChange?.(value);
    }

    public writeValue(value: boolean): void {
        this.isMinimized = value;
    }

    public registerOnChange(fn: (value: boolean) => void): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

}
