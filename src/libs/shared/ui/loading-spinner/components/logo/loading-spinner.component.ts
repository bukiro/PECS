import { Component, ChangeDetectionStrategy, HostBinding, Input } from '@angular/core';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-loading-spinner',
    templateUrl: './loading-spinner.component.html',
    styleUrls: ['./loading-spinner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent extends TrackByMixin(BaseClass) {

    @HostBinding('style.height')
    @HostBinding('style.width')
    @HostBinding('style.flex-basis')
    private _size = '4rem';

    public corners = [
        'top',
        'left',
        'right',
        'bottom',
    ];

    @Input()
    public set size(size: string) {
        this._size = size;
    }

}
