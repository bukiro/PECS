import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SkillsService } from '../skills.service';
import { CharacterService } from '../character.service';
import { TraitsService } from '../traits.service';
import { AbilitiesService } from '../abilities.service';
import { EffectsService } from '../effects.service';
import { Skill } from '../Skill';
import { v1 as uuidv1 } from 'uuid';

@Component({
    selector: 'app-skill',
    templateUrl: './skill.component.html',
    styleUrls: ['./skill.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillComponent implements OnInit {

    @Input()
    creature: string = "Character";
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
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_CalculatedIndex() {
        switch (this.creature) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
            case "Familiar":
                return 2;
        }
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_LabelID() {
        return uuidv1();
    }

    get_Name(skill: Skill) {
        if (!this.isDC && skill.name.includes("Spell DC")) {
            return skill.name.replace("Spell DC", "Spell Attacks");
        } else {
            return skill.name;
        }
    }

    get_SpecialShowon(skill: Skill) {
        let creature = this.get_Creature();
        //Under certain circumstances, some Feats apply to skills independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let specialNames: string[] = []
        //Show Path to Perfection notices on a save if any skill increases with that PtP as its source can be found
        if (skill.type == "Save" && creature.type == "Character") {
            if (creature.get_SkillIncreases(this.characterService, 1, this.get_Creature().level, skill.name, "Path to Perfection").length) {
                specialNames.push("Path to Perfection");
            }
            if (creature.get_SkillIncreases(this.characterService, 1, this.get_Creature().level, skill.name, "Second Path to Perfection").length) {
                specialNames.push("Second Path to Perfection");
            }
            if (creature.get_SkillIncreases(this.characterService, 1, this.get_Creature().level, skill.name, "Third Path to Perfection").length) {
                specialNames.push("Third Path to Perfection");
            }
        }
        return specialNames;
    }

    get_SpecialEffects(skill: Skill) {
        return skill.$absolutes[this.get_CalculatedIndex()].concat(skill.$relatives[this.get_CalculatedIndex()])
    }

    still_loading() {
        return this.skillsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
           setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["individualskills", "all", this.creature, this.skill.name].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature &&
                    (
                        view.target == "all" ||
                        (view.target == "individualskills" &&
                            (
                                [this.skill.name, this.skill.ability, "all"].includes(view.subtarget) ||
                                (
                                    this.get_Name(this.skill).includes("Attacks") &&
                                    view.subtarget == "attacks"
                                )
                            )
                        )
                    )) {
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
