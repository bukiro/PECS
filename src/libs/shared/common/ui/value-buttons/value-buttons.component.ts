import { Component, ChangeDetectionStrategy, model, input, booleanAttribute } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ValueEffectsButtonsComponent } from '../value-effects-buttons/value-effects-buttons.component';
import { BonusListComponent } from '../../../bonuses/ui/bonus-list/bonus-list.component';
import { CommonModule } from '@angular/common';
import { NgbPopover, NgbTooltip, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { ButtonComponent } from '../button/button.component';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';

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

    public readonly creature$$ = input<Creature | undefined>(undefined, { alias: 'creature' });

    public readonly title$$ = input<string | undefined>(undefined, { alias: 'title' });

    public readonly showBonusesIcon$$ = input(false,{ transform: booleanAttribute, alias: 'showBonusesIcon' });

    public readonly showNotesIcon$$ = input(false,{ transform: booleanAttribute, alias: 'showNotesIcon' });

    public readonly customEffectsTarget$$ = input<string | undefined>(undefined, { alias: 'customEffectsTarget' });

    public readonly bonuses$$ = input<Array<BonusDescription>>([], { alias: 'bonuses' });

    public readonly showButtons$$ = model(false, { alias: 'showButtons' });

    public readonly showNotes$$ = model(false, { alias: 'showNotes' });

}
