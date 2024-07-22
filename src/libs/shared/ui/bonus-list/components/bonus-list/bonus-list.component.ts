import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { CommonModule } from '@angular/common';

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
export class BonusListComponent extends TrackByMixin(BaseClass) {

    @Input()
    public bonuses?: Array<BonusDescription>;
}
