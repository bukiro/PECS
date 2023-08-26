import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionComponent extends TrackByMixin(BaseClass) {

    @Input()
    public text = '';
    @Input()
    public casting?: SpellCasting;
    @Input()
    public oneLiner = false;

}
