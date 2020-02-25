import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthComponent implements OnInit {

    public damage: number = 0;
    public healing: number = 0;

    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public effectsService: EffectsService
    ) { }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Health() {
        return this.characterService.get_Health();
    }

    on_DyingSave(success) {
        if (success) {
            this.get_Health().dying--;
            if (this.get_Health().dying == 0) {
                this.get_Health().wounded++
            }
        } else {
            this.get_Health().dying = Math.min(this.get_Health().dying + 1, this.get_Health().maxDying(this.effectsService))
        }
    }

    get_Resistances() {
        let effects = this.effectsService.get_Effects().all.filter(effect => effect.target.indexOf("Resistance") > -1);
        let resistances: any[] = [];
        effects.forEach(effect => {
            let value = effect.value.split("/");
            if (value.length == 1) {
                value.push("");
            }
            if (resistances.filter(res => res.target == effect.target && res.exception == value[1]).length) {
                let resistance = resistances.filter(res => res.target == effect.target && res.exception == value[1])[0];
                resistance.value += parseInt(value[0]);
                resistance.source += ", "+effect.source;
            } else {
                resistances.push({target:effect.target, value:parseInt(value[0]), exception:value[1], source:effect.source});
            }
        });
        resistances.forEach(res => {
            if (res.value < 0) {
                res.target = res.target.replace("Resistance", "Weakness");
            }
        });
        return resistances;
    }

    get_EffectsOnThis(name: string) {
        return this.effectsService.get_EffectsOnThis(name);
    }

    get_BonusesOnThis(name: string) {
        return this.effectsService.get_BonusesOnThis(name);
    }

    get_PenaltiesOnThis(name: string) {
        return this.effectsService.get_PenaltiesOnThis(name);
    }

    get_FeatsShowingOn(name: string) {
        return this.characterService.get_FeatsShowingOn(name);
    }

    set_CharacterChanged() {
        this.characterService.set_Changed();
    }

    finish_Loading() {
        if (this.still_loading()) {
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
