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

    get_EffectsOnThis(ObjectName: String) {
        return this.effectsService.get_EffectsOnThis(ObjectName);
    }

    get_ConditionsShowingOn(name: string) {
        return this.characterService.get_ConditionsShowingOn(name);
    }

    get_specialShowon(skill: Skill) {
        //Under certain circumstances, some Feats apply to skills independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let character = this.characterService.get_Character();
        let specialNames: string[] = []
        //Show Path to Perfection notices on a save if any skill increases with that PtP as its source can be found
        if (skill.type == "Save") {
            if (character.get_SkillIncreases(1, character.level, skill.name, "Path to Perfection").length) {
                specialNames.push("Path to Perfection");
            }
            if (character.get_SkillIncreases(1, character.level, skill.name, "Second Path to Perfection").length) {
                specialNames.push("Second Path to Perfection");
            }
            if (character.get_SkillIncreases(1, character.level, skill.name, "Third Path to Perfection").length) {
                specialNames.push("Third Path to Perfection");
            }
        }
        return specialNames;
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
