import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

@Component({
    selector: 'app-tile-mode-button',
    templateUrl: './tile-mode-button.component.html',
    styleUrls: ['./tile-mode-button.component.scss', '../button/button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: TileModeButtonComponent,
            multi: true,
        },
    ],
})
export class TileModeButtonComponent extends ToggleButtonComponent {

    public override isCompact = true;

    public override shouldShowLabel = true;

    public get tileModeLabel(): string {
        return this.value
            ? 'Click to enable list mode.'
            : 'Click to enable tile mode.';
    }
}
