import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/character.service';

@Component({
    selector: 'app-familiarabilities',
    templateUrl: './familiarabilities.component.html',
    styleUrls: ['./familiarabilities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamiliarabilitiesComponent implements OnInit {

    
    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService
    ) { }

    still_loading() {
        return (this.characterService.still_loading());
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span("familiarabilities");
        })
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Character() {
        return this.characterService.get_Character();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["familiarabilities", "all", "Familiar"].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == "Familiar" && ["familiarabilities", "all"].includes(view.target)) {
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
