import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TraitsService } from 'src/app/traits.service';
import { ActivitiesService } from 'src/app/activities.service';
import { CharacterService } from 'src/app/character.service';
import { Creature } from 'src/app/Creature';
import { Item } from 'src/app/Item';
import { RefreshService } from 'src/app/refresh.service';

@Component({
    selector: 'app-hintItem',
    templateUrl: './hintItem.component.html',
    styleUrls: ['./hintItem.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HintItemComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    item: Item | any;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private traitsService: TraitsService,
        private activitiesService: ActivitiesService,
        public characterService: CharacterService,
        private refreshService: RefreshService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Creature;
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    finish_Loading() {
        if (this.item.id) {
            this.refreshService.get_Changed
                .subscribe((target) => {
                    if (target == this.item.id) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.refreshService.get_ViewChanged
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

}
