import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-dice-icon-D12',
    templateUrl: './D12.svg',
    styleUrls: ['../dice-icon/dice-icon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceIconD12Component { }
