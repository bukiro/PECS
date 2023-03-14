import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { forceBooleanFromInput } from 'src/libs/shared/util/componentInputUtils';
import { BaseValueAccessorComponent } from '../base-value-accessor/base-value-accessor.component';

@Component({
    selector: 'app-text-input',
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TextInputComponent),
            multi: true,
        },
    ],
})
export class TextInputComponent extends BaseValueAccessorComponent<string> {

    @ViewChild('Input')
    public input?: ElementRef<HTMLInputElement>;

    @Input()
    public label?: string;

    @Input()
    public placeholder?: string;

    private _isPassword?: boolean;

    @Input()
    public set password(isPassword: boolean | string | undefined) {
        this._isPassword = forceBooleanFromInput(isPassword);
    }

    public get isPassword(): boolean {
        return !!this._isPassword;
    }

    public focus(): void {
        this.input?.nativeElement?.focus();
    }

}
