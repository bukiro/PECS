import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { PrettyValueComponent } from '../pretty-value/pretty-value.component';
import { DiceIconD20Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D20/dice-icon-D20.component';
import { QuickdiceComponent } from 'src/libs/shared/quickdice/components/quickdice/quickdice.component';

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
