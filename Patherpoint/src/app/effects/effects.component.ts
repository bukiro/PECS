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

    get_Effects(regenerate: boolean = false) {
        let effects = this.effectsService.get_Effects(regenerate);
        return effects;
    }

    get_AppliedEffects(regenerate: boolean = false) {
        let effects = this.get_Effects(regenerate);
        return effects.filter(effect => effect.apply)
    }

    get_NotAppliedEffects() {
        let effects = this.get_Effects();
        return effects.filter(effect => effect.apply != true)
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
