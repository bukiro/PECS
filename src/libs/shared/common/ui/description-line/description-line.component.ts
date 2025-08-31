import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpellCasting } from 'src/libs/shared/spells/util/models/spell-casting';
import { DescriptionPart } from '../../util/models/description-part';
import { DescriptionPartType } from '../../util/models/description-part-type';


@Component({
    selector: 'app-description-line',
    templateUrl: './description-line.component.html',
    styleUrls: ['./description-line.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        //QuickdiceComponent,
    ],
})
export class DescriptionLineComponent {
    public readonly line$$ = input.required<Array<DescriptionPart>>({ alias: 'line' });

    public readonly casting$$ = input<SpellCasting | undefined>(undefined, { alias: 'casting' });

    public readonly PartType = DescriptionPartType;
}
