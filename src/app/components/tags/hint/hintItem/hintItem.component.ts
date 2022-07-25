import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TraitsService } from 'src/app/services/traits.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { EffectsService } from 'src/app/services/effects.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trait } from 'src/app/classes/Trait';
import { Activity } from 'src/app/classes/Activity';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemRolesService } from 'src/app/services/itemRoles.service';
import { Rune } from 'src/app/classes/Rune';

interface ItemParameters {
    item: Item;
    asGrantingActivities: Equipment;
    asHavingItemActivities: Equipment | Rune;
}

@Component({
    selector: 'app-hintItem',
    templateUrl: './hintItem.component.html',
    styleUrls: ['./hintItem.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintItemComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public item: Item;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _effectsService: EffectsService,
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _traitsService: TraitsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        public trackers: Trackers,
    ) { }

    public get currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
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
        return this.item.effectiveTraits(this._characterService, this.currentCreature);
    }

    public traitFromName(name: string): Trait {
        return this._traitsService.traitFromName(name);
    }

    public activityFromName(name: string): Activity {
        return this._activitiesDataService.activityFromName(name);
    }

    public activityCooldown(activity: Activity): number {
        return activity.effectiveCooldown(
            { creature: this.currentCreature },
            { characterService: this._characterService, effectsService: this._effectsService },
        );
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
