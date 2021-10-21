import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { RefreshService } from 'src/app/refresh.service';

@Component({
    selector: 'app-familiarabilities',
    templateUrl: './familiarabilities.component.html',
    styleUrls: ['./familiarabilities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamiliarabilitiesComponent implements OnInit {

    @Input()
    public sheetSide: string = "left";

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService
    ) { }

    still_loading() {
        return (this.characterService.still_loading());
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
            this.refreshService.get_Changed
            .subscribe((target) => {
                if (["familiarabilities", "all", "Familiar"].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.refreshService.get_ViewChanged
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
