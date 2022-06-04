import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { Item } from 'src/app/classes/Item';
import { Equipment } from 'src/app/classes/Equipment';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { WornItem } from 'src/app/classes/WornItem';

@Component({
    selector: 'app-itemContent',
    templateUrl: './itemContent.component.html',
    styleUrls: ['./itemContent.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemContentComponent implements OnInit, OnDestroy {

    //This component queries many aspects of different types of item, not all of which exist on the Item class, so we allow any.
    @Input()
    item: Item | any;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly itemsService: ItemsService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Price(item: Item) {
        if (item.tradeable) {
            let price = item.get_Price(this.itemsService);

            if (price) {
                let priceString = '';

                if (price >= 100) {
                    priceString += `${ Math.floor(price / 100) }gp`;
                    price %= 100;

                    if (price >= 10) { priceString += ' '; }
                }

                if (price >= 10) {
                    priceString += `${ Math.floor(price / 10) }sp`;
                    price %= 10;

                    if (price >= 1) { priceString += ' '; }
                }

                if (price >= 1) {
                    priceString += `${ price }cp`;
                }

                return priceString;
            }
        }

        return '';
    }

    get_BulkDifference(item: Item) {
        const bulk = +item.effectiveBulk();

        if (!isNaN(bulk) && !isNaN(+item.bulk)) {
            return parseInt(item.effectiveBulk(), 10) - parseInt(item.bulk, 10);
        } else if (!isNaN(bulk) && isNaN(+item.bulk)) {
            return 1;
        } else if (isNaN(bulk) && !isNaN(+item.bulk)) {
            if (item.effectiveBulk() == 'L' && +item.bulk == 0) {
                return 1;
            } else {
                return -1;
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
        this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this.refreshService.processPreparedChanges();
    }

    public has_ShownData(): boolean {
        return this.item.data?.some(data => data.show);
    }

    finish_Loading() {
        if (this.item.id) {
            this.changeSubscription = this.refreshService.componentChanged$
                .subscribe(target => {
                    if (target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.detailChanged$
                .subscribe(view => {
                    if (view.target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
        }
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
