import { Component, OnInit } from '@angular/core';
import { EffectsService } from '../effects.service';
import { VirtualTimeScheduler } from 'rxjs';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css']
})
export class EffectsComponent implements OnInit {

    showEffects: boolean = false;

    constructor(
        private effectsService: EffectsService
    ) { }

    toggle_Effects() {
        this.showEffects = !this.showEffects;
    }

    get_Effects(regenerate: boolean = false) {
        return this.effectsService.get_Effects(regenerate);
    }

    get_AppliedEffects(regenerate: boolean = false) {
        let effects = this.get_Effects(regenerate);
        return effects.filter(effect => effect.apply)
    }

    get_NotAppliedEffects() {
        let effects = this.get_Effects();
        return effects.filter(effect => effect.apply != true)
    }

    ngOnInit() {
    }

}
