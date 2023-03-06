import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trait } from 'src/app/classes/Trait';
import { Activity } from 'src/app/classes/Activity';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { Rune } from 'src/app/classes/Rune';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ItemTraitsService } from 'src/libs/shared/services/item-traits/item-traits.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

interface ItemParameters {
    item: Item;
    asGrantingActivities?: Equipment;
    asHavingItemActivities?: Equipment | Rune;
}

@Component({
    selector: 'app-hint-item',
    templateUrl: './hint-item.component.html',
    styleUrls: ['./hint-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintItemComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public item!: Item;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _itemTraitsService: ItemTraitsService,
    ) {
        super();
    }

    public get currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public itemParameters(): ItemParameters {
        const itemRoles = this._itemRolesService.getItemRoles(this.item);

        return {
            item: this.item,
            asGrantingActivities: itemRoles.asEquipment,
            asHavingItemActivities: this.item instanceof Rune ? this.item : itemRoles.asEquipment,
        };
    }

    public itemTraits(): Array<string> {
        this._itemTraitsService.cacheItemEffectiveTraits(this.item, { creature: this.currentCreature });

        return this.item.$traits;
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public activityCooldown(activity: Activity): number {
        this._activityPropertiesService.cacheEffectiveCooldown(activity, { creature: this.currentCreature });

        return activity.$cooldown;
    }

    public ngOnInit(): void {
        if (this.item.id) {
            this._changeSubscription = this._refreshService.componentChanged$
                .subscribe(target => {
                    if (target === this.item.id) {
                        this._changeDetector.detectChanges();
                    }
                });
            this._viewChangeSubscription = this._refreshService.detailChanged$
                .subscribe(view => {
                    if (view.target === this.item.id) {
                        this._changeDetector.detectChanges();
                    }
                });
        }
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
