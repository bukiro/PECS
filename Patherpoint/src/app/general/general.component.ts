import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { Skill } from '../Skill';
import { EffectsService } from '../effects.service';
import { TraitsService } from '../traits.service';
import { FeatsService } from '../feats.service';
import { Speed } from '../Speed';

@Component({
    selector: 'app-general',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralComponent implements OnInit {

    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public effectsService: EffectsService,
        public traitsService: TraitsService,
    ) { }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    get_FeatsShowingOn(name: string) {
        return this.characterService.get_FeatsShowingOn(name);
    }

    get_EffectsOnThis(name: string) {
        return this.effectsService.get_EffectsOnThis(name);
    }

    get_ClassDCs() {
        return this.characterService.get_Skills("", "Class DC").filter(skill => skill.level(this.characterService) > 0);
    }

    get_Speeds() {
        let speeds = this.characterService.get_Speeds();
        let speedEffects = this.effectsService.get_Effects().all.filter(effect => effect.apply && (effect.target.indexOf("Speed") > -1));
        speedEffects.forEach(effect => {
            if (!speeds.filter(speed => speed.name == effect.target).length) {
                speeds.push(new Speed(effect.target))
            } 
        });
        return speeds.filter(speed => speed.value(this.characterService, this.effectsService)[0] != 0);
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
