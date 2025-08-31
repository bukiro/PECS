import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CornerButtonTrayComponent } from '../corner-button-tray/corner-button-tray.component';
import { ContentElementComponent } from '../content-element/content-element.component';

@Component({
    selector: 'app-fly-in-menu',
    templateUrl: './fly-in-menu.component.html',
    styleUrl: './fly-in-menu.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        CornerButtonTrayComponent,
    ],
    host: {
        'class.showing': 'show()',
        'class.left-bound': 'leftBound()',
        'class.top-bound': 'topBound()',

    },
})
export class FlyInMenuComponent extends ContentElementComponent {

    public readonly show = input(false);

    public readonly showCloseButton = input(false);

    public readonly closeButtonClicked = output<void>();

    public readonly position = input.required<'left' | 'top'>();

    public readonly leftBound = computed(() => this.position() === 'left');

    public readonly topBound = computed(() => this.position() === 'top');
}
