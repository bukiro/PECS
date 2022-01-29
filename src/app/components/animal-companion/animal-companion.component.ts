import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimalCompanionComponent implements OnInit, OnDestroy {

    public hover: string = '';
    private showMode: string = "";
    public mobile: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private animalCompanionsService: AnimalCompanionsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.companionMinimized = !this.characterService.get_Character().settings.companionMinimized;
        this.refreshService.set_ToChange("Companion", "companion");
        this.refreshService.set_ToChange("Companion", "abilities");
        this.refreshService.process_ToChange();
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.companionMinimized;
    }

    still_loading() {
        return (this.characterService.still_loading() || this.animalCompanionsService.still_loading());
    }

    toggleCompanionMenu() {
        this.characterService.toggle_Menu("companion");
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
    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }
    
    toggle_Mode(type: string) {
        if (this.showMode == type) {
            this.showMode = "";
        } else {
            this.showMode = type;
        }
    }

    get_ShowMode() {
        return this.showMode;
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["companion", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "companion" && ["companion", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    set_Mobile() {
        this.mobile = this.characterService.get_Mobile();
    }

    ngOnInit() {
        this.set_Mobile();
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.set_Mobile();
    }

    @HostListener('window:orientationchange', ['$event'])
    onRotate(event) {
        this.set_Mobile();
    }

}