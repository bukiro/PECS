import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { RefreshService } from 'src/app/services/refresh.service';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent implements OnInit, OnDestroy {

    @Input()
    public creature = 'Character';
    @Input()
    public sheetSide = 'left';

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public abilitiesService: AbilitiesDataService,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        public effectsService: EffectsService,
    ) { }

    minimize() {
        this.characterService.character().settings.abilitiesMinimized = !this.characterService.character().settings.abilitiesMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case 'Character':
                return this.characterService.character().settings.abilitiesMinimized;
            case 'Companion':
                return this.characterService.character().settings.companionMinimized;
        }
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.character();
    }

    get_Creature() {
        return this.characterService.creatureFromType(this.creature);
    }

    get_CalculatedIndex() {
        switch (this.creature) {
            case 'Character':
                return 0;
            case 'Companion':
                return 1;
        }
    }

    get_Abilities(subset = 0) {
        switch (subset) {
            case 0:
                return this.abilitiesService.abilities();
            case 1:
                return this.abilitiesService.abilities().filter((ability, index) => index <= 2);
            case 2:
                return this.abilitiesService.abilities().filter((ability, index) => index >= 3);
        }

    }

    public still_loading(): boolean {
        return this.abilitiesService.stillLoading || this.characterService.stillLoading;
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.componentChanged$
            .subscribe(target => {
                if (['abilities', 'all', this.creature.toLowerCase()].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['abilities', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
