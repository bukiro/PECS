import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-dice-icon-D10',
    templateUrl: './D10.svg',
    styleUrls: ['../dice-icon/dice-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceIconD10Component { }
