import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.component.html',
    styleUrls: ['./loading-spinner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent extends TrackByMixin(BaseClass) {

    public letters = [
        { letter: 'P', checked: false },
        { letter: 'E', checked: true },
        { letter: 'C', checked: false },
        { letter: 'S', checked: false },
    ];

}
