import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { AnimalCompanionsService } from '../animalcompanions.service';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimalCompanionComponent implements OnInit {

    public hover: string = '';

    constructor(
        private changeDetector:ChangeDetectorRef,
        private characterService: CharacterService,
        private animalCompanionsService: AnimalCompanionsService,
        tooltipConfig: NgbTooltipConfig
    ) {
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 100;
        tooltipConfig.triggers = "hover:click";
    }

    minimize() {
        this.characterService.get_Character().settings.companionMinimized = !this.characterService.get_Character().settings.companionMinimized;
        this.characterService.set_ToChange("Companion", "companion");
        this.characterService.set_ToChange("Companion", "abilities");
        this.characterService.process_ToChange();
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
        this.characterService.set_Changed(target);
    }

    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["companion", "all"].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature.toLowerCase() == "companion" && ["companion", "all"].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}