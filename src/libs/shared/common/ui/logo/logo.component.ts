import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DiamondLetters } from '../../util/models/diamond-letters';
import { DiamondComponent } from '../diamond/diamond.component';

@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss'],
    standalone: true,
    imports: [
        DiamondComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {

    public letters: DiamondLetters = [
        { letter: 'P', highlighted: false },
        { letter: 'E', highlighted: true },
        { letter: 'C', highlighted: false },
        { letter: 'S', highlighted: false },
    ];
}
