import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Trackers } from 'src/libs/shared/util/trackers';
import { BonusDescription } from '../../definitions/interfaces/bonus-description';

@Component({
    selector: 'app-bonus-list',
    templateUrl: './bonus-list.component.html',
    styleUrls: ['./bonus-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusListComponent extends Trackers {

    @Input()
    public bonuses?: Array<BonusDescription>;
}
