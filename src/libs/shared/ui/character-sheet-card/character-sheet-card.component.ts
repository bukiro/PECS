import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CornerButtonTrayComponent } from '../corner-button-tray/corner-button-tray.component';
import { ContentElementComponent } from '../../util/components/content-element/content-element.component';

@Component({
    selector: 'app-character-sheet-card',
    templateUrl: './character-sheet-card.component.html',
    styleUrl: './character-sheet-card.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        CornerButtonTrayComponent,
    ],
})
export class CharacterSheetCardComponent extends ContentElementComponent {
    @Input()
    public title?: string;
}
