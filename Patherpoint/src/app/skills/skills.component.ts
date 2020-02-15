import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AbilitiesService } from '../abilities.service';
import { CharacterService } from '../character.service';
import { SkillsService } from '../skills.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {

    proficiencyGroup;
    stuff;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public abilitiesService: AbilitiesService,
        public skillsService: SkillsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
    ) { }

    get_Skills(name: string = "", type: string = "") {
        //BUGFIXING ISSUE
        //if skills.component.html calls this function and receives [new Skill()] from the skillServcice (via the characterService), the page loads forever.
        if (type == "perception") {
            //return [new Skill()];
        }
        return this.characterService.get_Skills(name, type);
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
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
        this.skillsService.initialize()
        this.finish_Loading();
    }

}