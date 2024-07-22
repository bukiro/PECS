import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { QuickdiceComponent } from '../../../../quickdice/components/quickdice/quickdice.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { PrettyValueComponent } from '../pretty-value/pretty-value.component';
import { DiceIconD20Component } from '../../../dice-icons/components/dice-icon-D20/dice-icon-D20.component';

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
