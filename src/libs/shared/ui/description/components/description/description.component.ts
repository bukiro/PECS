import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { QuickdiceComponent } from 'src/libs/shared/quickdice/components/quickdice/quickdice.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        QuickdiceComponent,
    ],
})
export class DescriptionComponent extends TrackByMixin(BaseClass) {

    @Input()
    public text = '';
    @Input()
    public casting?: SpellCasting;
    @Input()
    public oneLiner = false;

}
