import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalCompanionComponent implements OnInit, OnDestroy {

    public hover = '';
    private showMode = '';
    public mobile = false;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly animalCompanionsService: AnimalCompanionsService,
    ) { }

    minimize() {
        this.characterService.get_Character().settings.companionMinimized = !this.characterService.get_Character().settings.companionMinimized;
        this.refreshService.set_ToChange('Companion', 'companion');
        this.refreshService.set_ToChange('Companion', 'abilities');
        this.refreshService.process_ToChange();
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.companionMinimized;
    }

    public still_loading(): boolean {
        return (this.characterService.still_loading() || this.animalCompanionsService.still_loading());
    }

    toggleCompanionMenu() {
        this.characterService.toggle_Menu('companion');
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CompanionMenuState() {
        return this.characterService.get_CompanionMenuState();
    }

    set_Changed(target: string) {
        this.refreshService.set_Changed(target);
    }

    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number): number {
        return index;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    toggle_Mode(type: string) {
        if (this.showMode == type) {
            this.showMode = '';
        } else {
            this.showMode = type;
        }
    }

    get_ShowMode() {
        return this.showMode;
    }

    set_Mobile() {
        this.mobile = this.characterService.get_Mobile();
    }

    public ngOnInit(): void {
        this.set_Mobile();
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['companion', 'all'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'companion' && ['companion', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.set_Mobile();
    }

    @HostListener('window:orientationchange', ['$event'])
    onRotate() {
        this.set_Mobile();
    }

}
