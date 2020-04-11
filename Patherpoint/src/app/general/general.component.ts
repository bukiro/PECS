import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { Skill } from '../Skill';
import { EffectsService } from '../effects.service';
import { TraitsService } from '../traits.service';
import { FeatsService } from '../feats.service';
import { Speed } from '../Speed';
import { Effect } from '../Effect';

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

    minimize() {
        this.characterService.get_Character().settings.generalMinimized = !this.characterService.get_Character().settings.generalMinimized;
    }

    set_Span() {
        setTimeout(() => {
            document.getElementById("general").style.gridRow = "span "+this.characterService.get_Span("general-height");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_DifferentWorldsFeat() {
        if (this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Different Worlds").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Different Worlds");
        }
    }

    get_ClassDCs() {
        return this.characterService.get_Skills("", "Class DC").filter(skill => skill.level(this.characterService) > 0);
    }

    get_SpellDCs() {
        return this.characterService.get_Skills("", "Spell DC").filter(skill => skill.level(this.characterService) > 0);
    }

    get_Speeds() {
        let speeds = this.characterService.get_Speeds();
        let speedEffects = this.effectsService.get_Effects().all.filter(effect => effect.apply && (effect.target.indexOf("Speed") > -1));
        if (this.get_Character().get_FeatsTaken(0, this.get_Character().level, "Quick Swim")) {
            if (this.characterService.get_Skills("Athletics")[0].level(this.characterService, this.get_Character().level) == 8) {
                let landSpeed = speeds.filter(speed => speed.name == "Land Speed")[0].value(this.characterService, this.effectsService)[0];
                let swimSpeed = speedEffects.filter(effect => effect.target == "Swim Speed").map(effect => parseInt(effect.value)).reduce((sum, current) => sum + current, 0);
                if (!swimSpeed || swimSpeed < landSpeed) 
                speedEffects.push(new Effect("", "Swim Speed", (landSpeed - swimSpeed).toString(), "Quick Swim", false, true, true))
            }
        }
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
