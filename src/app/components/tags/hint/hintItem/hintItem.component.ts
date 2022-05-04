import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TraitsService } from 'src/app/services/traits.service';
import { ActivitiesService } from 'src/app/services/activities.service';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { EffectsService } from 'src/app/services/effects.service';

@Component({
    selector: 'app-hintItem',
    templateUrl: './hintItem.component.html',
    styleUrls: ['./hintItem.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HintItemComponent implements OnInit {

    @Input()
    creature = 'Character';
    @Input()
    item: Item | any;

    constructor(
        public characterService: CharacterService,
        public effectsService: EffectsService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly traitsService: TraitsService,
        private readonly activitiesService: ActivitiesService,
        private readonly refreshService: RefreshService
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Creature;
    }

    get_Traits(name = '') {
        return this.traitsService.getTraits(name);
    }

    get_Activities(name = '') {
        return this.activitiesService.get_Activities(name);
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
