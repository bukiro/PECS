import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Trackers } from 'src/libs/shared/util/trackers';

@Component({
    selector: 'app-action-icons',
    templateUrl: './action-icons.component.html',
    styleUrls: ['./action-icons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionIconsComponent extends Trackers {

    public phrases: Array<string> = [];

    @Input()
    public set actionString(actionString: string) {
        this.phrases = actionString.split(' ') || [];
    }

}
