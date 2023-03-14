import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, Input, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseValueAccessorComponent } from '../base-value-accessor/base-value-accessor.component';

@Component({
    selector: 'app-checkbox-input',
    templateUrl: './checkbox-input.component.html',
    styleUrls: ['./checkbox-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CheckboxInputComponent),
            multi: true,
        },
    ],
})
export class CheckboxInputComponent extends BaseValueAccessorComponent<boolean> {

    @ViewChild('Input')
    public input?: ElementRef<HTMLInputElement>;

    @Input()
    public label?: string;

    public focus(): void {
        this.input?.nativeElement?.focus();
    }

}
