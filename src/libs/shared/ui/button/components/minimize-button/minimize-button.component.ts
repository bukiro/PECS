import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

@Component({
    selector: 'app-minimize-button',
    templateUrl: './minimize-button.component.html',
    styleUrls: ['./minimize-button.component.scss', '../button/button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: MinimizeButtonComponent,
            multi: true,
        },
    ],
})
export class MinimizeButtonComponent extends ToggleButtonComponent {

    constructor() {
        super();

        this.compact = true;
    }

    public get minimizeLabel(): string {
        return this.value
            ? 'Click to show all information.'
            : 'Click to show compact information.';
    }
}
