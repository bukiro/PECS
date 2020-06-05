import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { FamiliarsService } from '../familiars.service';

@Component({
    selector: 'app-familiar',
    templateUrl: './familiar.component.html',
    styleUrls: ['./familiar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamiliarComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private familiarsService: FamiliarsService,
    ) { }

    minimize() {
        this.characterService.get_Character().settings.familiarMinimized = !this.characterService.get_Character().settings.familiarMinimized;
        this.set_Changed("Familiar");
    }

    still_loading() {
        return (this.characterService.still_loading() || this.familiarsService.still_loading());
    }

    toggleFamiliarMenu() {
        this.characterService.toggleMenu("familiar");
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    set_Changed(target: string) {
        this.characterService.set_Changed(target);
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
                if (target == "familiar" || target == "all" || target == "Familiar") {
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