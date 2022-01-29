import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { TimeService } from 'src/app/services/time.service';
import { EffectsService } from 'src/app/services/effects.service';
import { ItemsService } from 'src/app/services/items.service';
import { SpellsService } from 'src/app/services/spells.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeComponent implements OnInit, OnDestroy {

    @Input()
    public showTurn: boolean = true;
    @Input()
    public showTime: boolean = true;
    @Input()
    public sheetSide: string = "center";

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private spellsService: SpellsService,
        private effectsService: EffectsService,
        private conditionsService: ConditionsService,
    ) { }

    minimize() {
        this.characterService.get_Character().settings.timeMinimized = !this.characterService.get_Character().settings.timeMinimized;
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.timeMinimized;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Duration(duration: number, includeTurnState: boolean = true, short: boolean = false) {
        return this.timeService.get_Duration(duration, includeTurnState, false, short);
    }

    get_Waiting(duration: number) {
        return this.timeService.get_Waiting(duration, {characterService: this.characterService, conditionsService: this.conditionsService}, {includeResting: false});
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_YourTurn() {
        return this.timeService.get_YourTurn();
    }

    start_Turn() {
        this.timeService.start_Turn(this.characterService, this.conditionsService, this.itemsService, this.spellsService, this.effectsService);
    }

    end_Turn() {
        this.timeService.end_Turn(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    tick(amount: number) {
        this.timeService.tick(this.characterService, this.conditionsService, this.itemsService, this.spellsService, amount);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["time", "all", "character"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" && ["time", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
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
