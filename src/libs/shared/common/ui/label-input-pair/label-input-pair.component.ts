import { booleanAttribute, ChangeDetectionStrategy, Component, forwardRef, input, viewChild } from '@angular/core';
import { BaseValueAccessorComponent } from '../base-value-accessor/base-value-accessor.component';
import { TextInputComponent } from '../text-input/text-input.component';
import { CheckboxInputComponent } from '../checkbox-input/checkbox-input.component';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-label-input-pair',
    templateUrl: './label-input-pair.component.html',
    styleUrls: ['./label-input-pair.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LabelInputPairComponent),
            multi: true,
        },
    ],
    standalone: true,
    imports: [
        FormsModule,
        NgbTooltip,
        CheckboxInputComponent,
        TextInputComponent,
    ],
})
export class LabelInputPairComponent extends BaseValueAccessorComponent<string | number | boolean> {

    public readonly input = viewChild<TextInputComponent | CheckboxInputComponent>('Input');

    public readonly type$$ = input<'text' | 'number' | 'switch'>('text', { alias: 'type' });

    public readonly label$$ = input<string | undefined>(undefined, { alias: 'label' });

    public readonly sublines$$ = input<Array<string>>([], { alias: 'sublines' });

    public readonly hint$$ = input<string | undefined>(undefined, { alias: 'hint' });

    public readonly password$$ = input(false, { transform: booleanAttribute, alias: 'password' });

    public focus(): void {
        this.input()?.focus();
    }

}
