import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { ConditionGain } from '../ConditionGain';
import { Health } from '../Health';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthComponent implements OnInit {

    public damage: number = 0;
    public nonlethal: boolean = false;
    public healing: number = 0;
    public addTempHP: number = 0;
    public Math = Math;

    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public effectsService: EffectsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.healthMinimized = !this.characterService.get_Character().settings.healthMinimized;
    }

    set_Span() {
        setTimeout(() => {
            document.getElementById("health").style.gridRow = "span "+this.characterService.get_Span("health-height");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    calculate_Health() {
        let health = this.get_Health();
        health.calculate(this.characterService, this.effectsService);
        return this.get_Health()
    }
    
    get_Health() {
        return this.characterService.get_Health()
    }

    on_DyingSave(success) {
        let maxDying = this.get_Health().$maxDying;
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            this.characterService.get_AppliedConditions("Dying").forEach(gain => {
                gain.value = Math.max(gain.value - 1, 0);
            })
        } else {
            this.characterService.get_AppliedConditions("Dying").forEach(gain => {
                gain.value = Math.min(gain.value + 1, maxDying);
            })
            if (this.get_Health().dying(this.characterService) >= maxDying) {
                if (this.characterService.get_AppliedConditions("Dead").length == 0) {
                    this.characterService.add_Condition(Object.assign(new ConditionGain, {name:"Dead", source:"Failed Dying Save"}), false)
                }
            }
        }
        this.characterService.set_Changed();
    }

    on_HeroPointRecover() {
        this.characterService.get_AppliedConditions("Dying").forEach(gain => {
            this.characterService.remove_Condition(gain, false, false);
        });
        this.get_Character().heroPoints = 0;
        this.characterService.set_Changed();
    }

    on_HealWounded() {
        this.characterService.get_AppliedConditions("Wounded").forEach(gain => {
            this.characterService.remove_Condition(gain, false);
        })
        this.characterService.set_Changed();
    }

    get_NumbToDeath() {
        return this.get_Character().get_FeatsTaken(0, this.get_Character().level, "Numb to Death").length;
    }

    add_TempHP(amount: number) {
        this.get_Health().temporaryHP = Math.max(0, this.get_Health().temporaryHP + amount);
        //this.characterService.set_Changed();
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

    get_BonusesOnThis(name: string) {
        return this.effectsService.get_BonusesOnThis(name);
    }

    get_PenaltiesOnThis(name: string) {
        return this.effectsService.get_PenaltiesOnThis(name);
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
