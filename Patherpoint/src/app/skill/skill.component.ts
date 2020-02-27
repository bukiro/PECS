import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SkillsService } from '../skills.service';
import { CharacterService } from '../character.service';
import { TraitsService } from '../traits.service';
import { AbilitiesService } from '../abilities.service';
import { EffectsService } from '../effects.service';
import { Skill } from '../Skill';

@Component({
    selector: 'app-skill',
    templateUrl: './skill.component.html',
    styleUrls: ['./skill.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillComponent implements OnInit {

    @Input()
    skill: Skill;
    @Input()
    showValue: boolean = true;
    @Input()
    isDC: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public abilitiesService: AbilitiesService,
        public skillsService: SkillsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
    ) { }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type);
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    still_loading() {
        return this.skillsService.still_loading() || this.characterService.still_loading();
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
