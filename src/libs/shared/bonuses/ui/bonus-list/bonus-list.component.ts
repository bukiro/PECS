import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BonusDescription } from '../../util/models/bonus-description';

@Component({
    selector: 'app-bonus-list',
    templateUrl: './bonus-list.component.html',
    styleUrls: ['./bonus-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
    ],
})
export class BonusListComponent {

    public bonuses$$ = input<Array<BonusDescription>>([], { alias: 'bonuses' });
}
