import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-action-icons',
    templateUrl: './action-icons.component.html',
    styleUrls: ['./action-icons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionIconsComponent extends TrackByMixin(BaseClass) {

    public phrases: Array<string> = [];

    @Input()
    public set actionString(actionString: string) {
        this.phrases = actionString.split(' ') || [];
    }

}
