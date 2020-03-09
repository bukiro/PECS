import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsComponent implements OnInit {

    showEffects: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private effectsService: EffectsService,
        private characterService: CharacterService
    ) { }

    toggle_Effects() {
        this.showEffects = !this.showEffects;
    }

    get_Effects() {
        return this.effectsService.get_Effects();
    }

    get_Conditions() {
        return this.characterService.get_ActiveConditions();
    }

    get_AppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.apply);
    }

    get_NotAppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.apply != true);
    }

    get_ActiveConditions(name: string = "", source: string = "") {
        return this.characterService.get_ActiveConditions(name, source);
    }
    
    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
