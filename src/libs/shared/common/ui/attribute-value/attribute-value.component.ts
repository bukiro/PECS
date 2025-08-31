import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, model, input, booleanAttribute } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/bonuses/util/models/bonus-description';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { PrettyValueComponent } from '../pretty-value/pretty-value.component';
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
        //ValueQuickdiceComponent,
        ValueButtonsComponent,
    ],
})
export class AttributeValueComponent {
    public creature$$ = input<Creature | undefined>(undefined, { alias: 'creature ' });

    public title$$ = input<string | undefined>(undefined, { alias: 'title' });

    public sublines$$ = input<Array<string>>([], { alias: 'sublines' });

    public value$$ = input<number | undefined>(undefined, { alias: 'value' });

    public showNotesIcon$$ = input(false, { alias: 'showNotesIcon' });

    public showDiceIcon$$ = input(false, { alias: 'showDiceIcon' });

    public customEffectsTarget$$ = input<string | undefined>(undefined, { alias: 'customEffectsTarget' });

    public bonuses$$ = input<Array<BonusDescription>>([], { alias: 'bonuses' });

    public showNotes$$ = model(false, { alias: 'showNotes' });

    public showValueOnLeftSide$$ = input(false, { transform: booleanAttribute, alias: 'showValueOnLeftSide' });
}
