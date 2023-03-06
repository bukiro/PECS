import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-dice-icon-D20',
    templateUrl: './D20.svg',
    styleUrls: ['../dice-icon/dice-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceIconD20Component { }
