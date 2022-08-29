import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Trackers } from 'src/libs/shared/util/trackers';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionComponent {

    @Input()
    public text = '';
    @Input()
    public casting?: SpellCasting;
    @Input()
    public oneLiner = false;

    constructor(
        public trackers: Trackers,
    ) { }

}
