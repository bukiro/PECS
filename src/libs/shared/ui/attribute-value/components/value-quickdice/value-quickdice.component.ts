import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { DiceIconsModule } from 'src/libs/shared/ui/dice-icons/dice-icons.module';
import { QuickdiceComponent } from '../../../../quickdice/components/quickdice/quickdice.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { PrettyValueComponent } from '../pretty-value/pretty-value.component';


@Component({
    selector: 'app-value-quickdice',
    templateUrl: './value-quickdice.component.html',
    styleUrls: ['./value-quickdice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        DiceIconsModule,
        ButtonComponent,
        PrettyValueComponent,
    ],
})
export class ValueQuickdiceComponent extends QuickdiceComponent {
    @Input()
    public bonuses?: Array<BonusDescription>;
}
