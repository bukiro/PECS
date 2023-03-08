import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Trait } from 'src/app/classes/Trait';
import { Item, TraitActivation } from 'src/app/classes/Item';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature } from 'src/app/classes/Creature';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-trait',
    templateUrl: './trait.component.html',
    styleUrls: ['./trait.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraitComponent extends TrackByMixin(BaseClass) {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public trait!: Trait;
    @Input()
    public name?: string;
    @Input()
    public item?: Item;
    @Input()
    public extraDescription?: string;

    constructor(
        private readonly _refreshService: RefreshService,
    ) {
        super();
    }

    public currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public onActivateEffect(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public objectTraitActivations(): Array<TraitActivation> {
        if (this.item) {
            this.item.prepareTraitActivations();

            return this.item.traitActivations.filter(activation =>
                activation.trait === this.trait.name ||
                (
                    this.trait.dynamic &&
                    activation.trait.includes(this.trait.name)
                ),
            );
        }

        return [];
    }

}
