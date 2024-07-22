import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-dice-icon-D8',
    templateUrl: './D8.svg',
    styleUrls: ['../dice-icon/dice-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class DiceIconD8Component { }
