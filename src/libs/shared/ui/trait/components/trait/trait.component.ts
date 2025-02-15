import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Trait } from 'src/app/classes/hints/trait';
import { Item, TraitActivation } from 'src/app/classes/items/item';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { FormsModule } from '@angular/forms';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { DescriptionComponent } from '../../../description/components/description/description.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-trait',
    templateUrl: './trait.component.html',
    styleUrls: ['./trait.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbPopover,
        NgbTooltip,

        DescriptionComponent,
    ],
})
export class TraitComponent extends TrackByMixin(BaseClass) {

    @Input()
    public creatureType: CreatureTypes = CreatureTypes.Character;
    @Input()
    public trait!: Trait;
    @Input()
    public name?: string;
    @Input()
    public item?: Item;
    @Input()
    public extraDescription?: string;

    public objectTraitActivations$(): Observable<Array<TraitActivation>> {
        if (this.item) {
            return this.item.traitActivations$$
                .pipe(
                    map(activations => activations
                        .filter(activation =>
                            activation.trait === this.trait.name ||
                            (
                                this.trait.dynamic &&
                                activation.trait.includes(this.trait.name)
                            ),
                        ),
                    ),
                );
        }

        return of([]);
    }

}
