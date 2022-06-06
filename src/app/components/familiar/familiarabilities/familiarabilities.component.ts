import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';

@Component({
    selector: 'app-familiarabilities',
    templateUrl: './familiarabilities.component.html',
    styleUrls: ['./familiarabilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliarabilitiesComponent implements OnInit, OnDestroy {

    @Input()
    public sheetSide = 'left';

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.character;
    }

    get_FamiliarAvailable() {
        return this.characterService.isFamiliarAvailable();
    }

    get_Familiar() {
        return this.characterService.familiar;
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.componentChanged$
            .subscribe(target => {
                if (['familiarabilities', 'all', 'Familiar'].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature == 'Familiar' && ['familiarabilities', 'all'].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
