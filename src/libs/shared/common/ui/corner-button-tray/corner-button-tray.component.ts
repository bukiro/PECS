import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

@Component({
    selector: 'app-corner-button-tray',
    templateUrl: './corner-button-tray.component.html',
    styleUrl: './corner-button-tray.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        ButtonComponent,
        ToggleButtonComponent,
    ],
})
export class CornerButtonTrayComponent {

    public readonly showCloseButton$$ = input(false, { alias: 'showCloseButton' });

    public readonly showMinimizeButton$$ = input(false, { alias: 'showMinimizeButton' });

    public readonly showTileModeButton$$ = input(false, { alias: 'showTileModeButton' });

    public readonly minimized$$ = model(false, { alias: 'minimized' });

    public readonly tileMode$$ = model(false, { alias: 'tileMode' });

    public readonly closeButtonClicked = output<void>();

    public readonly activeMinimizeLabel = 'Click to show all information.';
    public readonly inactiveMinimizeLabel = 'Click to show compact information.';
    public readonly activeTileModeLabel = 'Click to enable list mode.';
    public readonly inactiveTileModeLabel = 'Click to enable tile mode.';
}
