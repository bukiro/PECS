
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { DiamondLetters } from '../../util/models/diamond-letters';

@Component({
    selector: 'app-diamond',
    templateUrl: './diamond.component.html',
    styleUrls: ['./diamond.component.scss'],
    standalone: true,
    imports: [
        NgbTooltip,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'style.height.em': 'size$$()',
        'style.width.em': 'size$$()',
        'style.flex-basis.em': 'size$$()',
    },
})
export class DiamondComponent {
    public readonly size$$ = input(1, { alias: 'size' });

    public readonly letters$$ = input<DiamondLetters>([
        { letter: '', highlighted: false },
        { letter: '', highlighted: false },
        { letter: '', highlighted: false },
        { letter: '', highlighted: false },
    ], { alias: 'letters' });

    public readonly accented$$ = input(false, { alias: 'accented' });
}
