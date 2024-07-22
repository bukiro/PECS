import { ChangeDetectionStrategy, Component, forwardRef, Input, ViewChild } from '@angular/core';
import { BaseValueAccessorComponent } from '../base-value-accessor/base-value-accessor.component';
import { v4 as uuidv4 } from 'uuid';
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

    @ViewChild('Input')
    public input?: TextInputComponent | CheckboxInputComponent;

    @Input()
    public type: 'text' | 'number' | 'switch' = 'text';

    @Input()
    public label?: string;

    @Input()
    public sublines?: Array<string>;

    @Input()
    public hint?: string;

    @Input()
    public password?: boolean | string;

    public id = uuidv4();

    public focus(): void {
        this.input?.focus();
    }

    public trackByIndex(index: number): number { return index; }

}
