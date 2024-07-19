import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DiamondComponent } from '../../../diamond/components/diamond/diamond.component';
import { DiamondLetters } from '../../../diamond/definitions/diamond-letters';

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
