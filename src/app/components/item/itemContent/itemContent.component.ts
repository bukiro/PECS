import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { Item } from 'src/app/classes/Item';
import { Equipment } from 'src/app/classes/Equipment';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Consumable } from 'src/app/classes/Consumable';
import { WornItem } from 'src/app/classes/WornItem';

@Component({
    selector: 'app-itemContent',
    templateUrl: './itemContent.component.html',
    styleUrls: ['./itemContent.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemContentComponent implements OnInit, OnDestroy {

    //This component queries many aspects of different types of item, not all of which exist on the Item class, so we allow any.
    @Input()
    item: Item | any;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private itemsService: ItemsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_FullPrice(item: Item) {
        if (item instanceof Equipment) {
            return item.get_Price(this.itemsService);
        } else {
            return item.price;
        }
    }

    get_Price(item: Item) {
        if (this.get_FullPrice(item)) {
            if (item.price == 0) {
                return "";
            } else {
                let price: number = this.get_FullPrice(item);
                let priceString: string = "";
                if (price >= 100) {
                    priceString += Math.floor(price / 100) + "gp";
                    price %= 100;
                    if (price >= 10) { priceString += " "; }
                }
                if (price >= 10) {
                    priceString += Math.floor(price / 10) + "sp";
                    price %= 10;
                    if (price >= 1) { priceString += " "; }
                }
                if (price >= 1) {
                    priceString += price + "cp";
                }
                return priceString;
            }
        } else {
            return "";
        }
    }

    get_BulkDifference(item: Item) {
        let bulk = +item.get_Bulk();
        if (!isNaN(bulk) && !isNaN(+item.bulk)) {
            return parseInt(item.get_Bulk()) - parseInt(item.bulk)
        } else if (!isNaN(bulk) && isNaN(+item.bulk)) {
            return 1
        } else if (isNaN(bulk) && !isNaN(+item.bulk)) {
            if (item.get_Bulk() == "L" && +item.bulk == 0) {
                return 1;
            } else {
                return -1
            }
        }
    }

    get_LanguageGains() {
        if (this.item instanceof WornItem) {
            return this.item.gainLanguages.filter(gain => !gain.locked);
        } else {
            return [];
        }
    }

    on_LanguageUpdate() {
        this.refreshService.set_ToChange("Character", "general");
        this.refreshService.process_ToChange();
    }

    public has_ShownData(): boolean {
        return this.item.data?.some(data => data.show);
    }

    finish_Loading() {
        if (this.item.id) {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
