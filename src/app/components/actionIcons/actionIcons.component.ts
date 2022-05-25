import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Trackers } from 'src/libs/shared/util/trackers';

@Component({
    selector: 'app-actionIcons',
    templateUrl: './actionIcons.component.html',
    styleUrls: ['./actionIcons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionIconsComponent {

    @Input()
    public actionString = '';

    constructor(
        public trackers: Trackers,
    ) { }

    public phrases(): Array<string> {
        return this.actionString?.split(' ') || [];
    }

}
