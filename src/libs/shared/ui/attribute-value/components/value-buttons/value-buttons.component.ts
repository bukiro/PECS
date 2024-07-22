import { Component, ChangeDetectionStrategy, Input, model } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { CommonModule } from '@angular/common';
import { NgbCollapse, NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from '../../../button/components/button/button.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { ToggleButtonComponent } from '../../../button/components/toggle-button/toggle-button.component';
import { FormsModule } from '@angular/forms';
import { ValueEffectsButtonsComponent } from '../value-effects-buttons/value-effects-buttons.component';
import { BonusListComponent } from '../../../bonus-list/components/bonus-list/bonus-list.component';

@Component({
    selector: 'app-value-buttons',
    templateUrl: './value-buttons.component.html',
    styleUrls: ['./value-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbPopover,
        NgbTooltip,
        NgbCollapse,

        ButtonComponent,
        ToggleButtonComponent,
        ValueEffectsButtonsComponent,
        BonusListComponent,
    ],
})
export class ValueButtonsComponent {
    @Input()
    public creature?: Creature;

    @Input()
    public title?: string;

    @Input()
    public showBonusesIcon?: boolean;

    @Input()
    public showNotesIcon?: boolean;

    @Input()
    public customEffectsTarget?: string;

    @Input()
    public bonuses?: Array<BonusDescription>;

    public showButtons = false;

    public showNotes = model<boolean>(false);
}
