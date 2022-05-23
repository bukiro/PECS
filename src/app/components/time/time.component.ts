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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeComponent implements OnInit, OnDestroy {

    @Input()
    public showTurn = true;
    @Input()
    public showTime = true;
    @Input()
    public sheetSide = 'center';

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly timeService: TimeService,
        private readonly itemsService: ItemsService,
        private readonly spellsService: SpellsService,
        private readonly effectsService: EffectsService,
        private readonly conditionsService: ConditionsService,
    ) { }

    minimize() {
        this.characterService.character().settings.timeMinimized = !this.characterService.character().settings.timeMinimized;
    }

    get_Minimized() {
        return this.characterService.character().settings.timeMinimized;
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_Duration(duration: number, includeTurnState = true, short = false) {
        return this.timeService.getDurationDescription(duration, includeTurnState, false, short);
    }

    get_Waiting(duration: number) {
        return this.timeService.getWaitingDescription(duration, { characterService: this.characterService, conditionsService: this.conditionsService }, { includeResting: false });
    }

    public still_loading(): boolean {
        return this.characterService.stillLoading;
    }

    get_YourTurn() {
        return this.timeService.getYourTurn();
    }

    start_Turn() {
        this.timeService.startTurn(this.characterService, this.conditionsService, this.itemsService, this.spellsService, this.effectsService);
    }

    end_Turn() {
        this.timeService.endTurn(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    tick(amount: number) {
        this.timeService.tick(this.characterService, this.conditionsService, this.itemsService, this.spellsService, amount);
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.componentChanged$
            .subscribe(target => {
                if (['time', 'all', 'character'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'character' && ['time', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
