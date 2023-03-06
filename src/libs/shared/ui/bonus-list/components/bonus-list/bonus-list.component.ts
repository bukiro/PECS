import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';
import { BonusDescription } from '../../definitions/interfaces/bonus-description';

@Component({
    selector: 'app-bonus-list',
    templateUrl: './bonus-list.component.html',
    styleUrls: ['./bonus-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusListComponent extends TrackByMixin(BaseClass) {

    @Input()
    public bonuses?: Array<BonusDescription>;
}
