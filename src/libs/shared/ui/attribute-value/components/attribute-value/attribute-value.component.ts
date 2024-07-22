import { Component, ChangeDetectionStrategy, Input, model, input } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { forceBooleanFromInput } from 'src/libs/shared/util/component-input-utils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { CommonModule } from '@angular/common';
import { PrettyValueComponent } from '../pretty-value/pretty-value.component';
import { ValueQuickdiceComponent } from '../value-quickdice/value-quickdice.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { ValueButtonsComponent } from '../value-buttons/value-buttons.component';

@Component({
    selector: 'app-attribute-value',
    templateUrl: './attribute-value.component.html',
    styleUrls: ['./attribute-value.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        PrettyValueComponent,
        ValueQuickdiceComponent,
        ValueButtonsComponent,
    ],
})
export class AttributeValueComponent extends TrackByMixin(BaseClass) {
    @Input()
    public creature?: Creature;

    @Input()
    public title?: string;

    @Input()
    public sublines?: Array<string>;

    @Input()
    public value?: number;

    @Input()
    public showNotesIcon?: boolean;

    @Input()
    public showDiceIcon?: boolean;

    @Input()
    public customEffectsTarget?: string;

    @Input()
    public bonuses?: Array<BonusDescription>;

    public showNotes = model<boolean>(false);

    public showValueOnLeftSide = input<boolean, boolean | string | undefined>(false, { transform: value => forceBooleanFromInput(value) });
}
