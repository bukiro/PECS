import { booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, forwardRef, input, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
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
    standalone: true,
    imports: [FormsModule],
})
export class TextInputComponent extends BaseValueAccessorComponent<string> {

    public readonly input = viewChild<ElementRef<HTMLInputElement>>('Input');

    public readonly label$$ = input<string | undefined>(undefined, { alias: 'label' });

    public readonly placeholder$$ = input<string | undefined>(undefined, { alias: 'placeholder' });

    public readonly password$$ = input(false, { transform: booleanAttribute, alias: 'password' });

    public focus(): void {
        this.input()?.nativeElement?.focus();
    }

}
