import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { ButtonComponent } from '../../../../../libs/shared/common/ui/button/button.component';
import { PrettyValueComponent } from '../../../../../libs/shared/common/ui/pretty-value/pretty-value.component';


@Component({
    selector: 'app-value-quickdice',
    templateUrl: './value-quickdice.component.html',
    styleUrls: ['./value-quickdice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        ButtonComponent,
        PrettyValueComponent,
        DiceIconD20Component,
    ],
})
export class ValueQuickdiceComponent extends QuickdiceComponent {
    @Input()
    public bonuses?: Array<BonusDescription>;
}
