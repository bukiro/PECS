
import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core';
import { DiamondLetters } from '../../definitions/diamond-letters';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-diamond',
    templateUrl: './diamond.component.html',
    styleUrls: ['./diamond.component.scss'],
    standalone: true,
    imports: [
        NgbTooltip,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiamondComponent {
    @HostBinding('style.height.em')
    @HostBinding('style.width.em')
    @HostBinding('style.flex-basis.em')
    @Input()
    public size = 1;

    @Input()
    public letters: DiamondLetters = [
        { letter: '', highlighted: false },
        { letter: '', highlighted: false },
        { letter: '', highlighted: false },
        { letter: '', highlighted: false },
    ];

    @Input()
    public accented = false;
}
