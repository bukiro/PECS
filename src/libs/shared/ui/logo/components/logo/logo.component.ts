import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent extends TrackByMixin(BaseClass) {

    public letters = [
        { letter: 'P', checked: false },
        { letter: 'E', checked: true },
        { letter: 'C', checked: false },
        { letter: 'S', checked: false },
    ];

}
