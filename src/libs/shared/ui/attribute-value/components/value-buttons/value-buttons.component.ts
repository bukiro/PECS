import { Component, ChangeDetectionStrategy, Input, model } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { CommonModule } from '@angular/common';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ObjectEffectsModule } from 'src/libs/shared/object-effects/object-effects.module';
import { ButtonComponent } from '../../../button/components/button/button.component';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { ToggleButtonComponent } from '../../../button/components/toggle-button/toggle-button.component';
import { BonusListModule } from '../../../bonus-list/bonus-list.module';
import { FormsModule } from '@angular/forms';
import { ValueEffectsButtonsComponent } from '../value-effects-buttons/value-effects-buttons.component';

@Component({
    selector: 'app-value-buttons',
    templateUrl: './value-buttons.component.html',
    styleUrls: ['./value-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NgbPopoverModule,
        NgbTooltipModule,
        NgbCollapseModule,
        ObjectEffectsModule,
        ButtonComponent,
        ToggleButtonComponent,
        BonusListModule,
        ValueEffectsButtonsComponent,
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
