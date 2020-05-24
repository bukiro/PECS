import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { ConditionGain } from '../ConditionGain';
import { Health } from '../Health';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthComponent implements OnInit {

    @Input()
    creature: string = "Character";

    public damage: number = 0;
    public nonlethal: boolean = false;
    public healing: number = 0;
    public addTempHP: number = 0;
    public Math = Math;

    constructor(
        private changeDetector:ChangeDetectorRef,
        private timeService: TimeService,
        public characterService: CharacterService,
        public effectsService: EffectsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.healthMinimized = !this.characterService.get_Character().settings.healthMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-health");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    rest() {
        this.timeService.rest(this.characterService);
    }

    die(reason: string) {
        if (this.characterService.get_AppliedConditions(this.get_Creature(), "Dead").length == 0) {
            this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, {name:"Dead", source:reason}), false)
            this.characterService.get_AppliedConditions(this.get_Creature(), "Doomed").forEach(gain => {
                this.characterService.remove_Condition(this.get_Creature(), gain, false);
            })
        }
    }

    calculate_Health() {
        let health: Health = this.get_Health();
        health.calculate(this.get_Creature(), this.characterService, this.effectsService);
        if (health.$dying >= health.$maxDying) {
            if (this.characterService.get_AppliedConditions(this.get_Creature(), "Doomed").length) {
                this.die("Doomed");
            } else {
                this.die("Dying value too high")
            }
        }
        return this.get_Health()
    }
    
    get_Health() {
        return this.characterService.get_Health(this.get_Creature())
    }

    on_DyingSave(success) {
        let maxDying = this.get_Health().$maxDying;
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            this.characterService.get_AppliedConditions(this.get_Creature(), "Dying").forEach(gain => {
                gain.value = Math.max(gain.value - 1, 0);
            })
        } else {
            this.characterService.get_AppliedConditions(this.get_Creature(), "Dying").forEach(gain => {
                gain.value = Math.min(gain.value + 1, maxDying);
            })
            if (this.get_Health().dying(this.get_Creature(), this.characterService) >= maxDying) {
                this.die("Failed Dying Save");
            }
        }
        this.characterService.set_Changed();
    }

    on_HeroPointRecover() {
        this.characterService.get_AppliedConditions(this.get_Creature(), "Dying").forEach(gain => {
            this.characterService.remove_Condition(this.get_Creature(), gain, false, false);
        });
        this.get_Character().heroPoints = 0;
        this.characterService.set_Changed();
    }

    on_HealWounded() {
        this.characterService.get_AppliedConditions(this.get_Creature(), "Wounded").forEach(gain => {
            this.characterService.remove_Condition(this.get_Creature(), gain, false);
        })
        this.characterService.set_Changed();
    }

    get_NumbToDeath() {
        if (this.get_Creature().type == "Character") {
            return this.get_Character().get_FeatsTaken(0, this.get_Character().level, "Numb to Death").length;
        } else {
            return 0;
        }
        
    }

    add_TempHP(amount: number) {
        this.get_Health().temporaryHP = Math.max(0, this.get_Health().temporaryHP + amount);
        //this.characterService.set_Changed();
    }

    get_Resistances() {
        //There should be no absolutes in resistances. If there are, they will be treated as relatives here.
        let effects = this.effectsService.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.target.includes("Resistance") && effect.apply);
        let resistances: any[] = [];
        effects.forEach(effect => {
            let value = effect.setValue || effect.value;
            let split = effect.target.split("/");
            if (split.length == 1) {
                split.push("");
            }
            if (resistances.filter(res => res.target == split[0] && res.exception == split[1]).length) {
                let resistance = resistances.filter(res => res.target == split[0] && res.exception == split[1])[0];
                resistance.value += parseInt(value);
                resistance.source += ", "+effect.source;
            } else {
                resistances.push({target:split[0], value:parseInt(value), exception:split[1], source:effect.source});
            }
        });
        resistances.forEach(res => {
            if (res.value < 0) {
                res.target = res.target.replace("Resistance", "Weakness");
            }
        });
        return resistances;
    }

    get_AbsolutesOnThis(name: string) {
        return this.effectsService.get_AbsolutesOnThis(this.get_Creature(), name);
    }

    show_BonusesOnThis(name: string) {
        return this.effectsService.show_BonusesOnThis(this.get_Creature(), name);
    }

    show_PenaltiesOnThis(name: string) {
        return this.effectsService.show_PenaltiesOnThis(this.get_Creature(), name);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "health" || target == "all" || target == this.creature) {
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
