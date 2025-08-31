import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DescriptionLineComponent } from '../description-line/description-line.component';
import { CommonModule } from '@angular/common';
import { SpellCasting } from 'src/libs/shared/spells/util/models/spell-casting';
import { DescriptionPart } from '../../util/models/description-part';
import { DescriptionPartType } from '../../util/models/description-part-type';

function mapPart(part: string): DescriptionPart {
    const diceString = 'dice=';

    if (part.toLowerCase().startsWith(diceString)) {
        return {
            content: part.toLowerCase().replace(diceString, ''),
            type: DescriptionPartType.Dice,
        };
    } else {
        return {
            content: part.trim(),
            type: part.includes('<') ? DescriptionPartType.Html : DescriptionPartType.Text,
        };
    }
}

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        DescriptionLineComponent,
    ],
})
export class DescriptionComponent {
    /**
     * Text input uses '\n' to separate lines and '|' to separate functional blocks.
     * This component cleanly displays the lines and blocks.
     */
    public readonly text$$ = input.required<string>({ alias: 'text' });

    public readonly casting$$ = input<SpellCasting | undefined>(undefined, { alias: 'casting' });

    public readonly oneLiner$$ = input(false, { alias: 'oneLiner' });

    public readonly lines$$ = computed(() => {
        const text = this.text$$();

        const lines = this.oneLiner$$() ? text.split('\n') : [text];

        return lines.map(line => line.split('|').map(mapPart));
    });
}
