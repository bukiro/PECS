import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-dice-icon-D4',
    templateUrl: './D4.svg',
    styleUrls: ['../dice-icon/dice-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class DiceIconD4Component { }
