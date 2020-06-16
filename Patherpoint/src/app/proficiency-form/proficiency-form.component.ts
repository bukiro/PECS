import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Skill } from '../Skill';
import { CharacterService } from '../character.service';
import { AnimalCompanion } from '../AnimalCompanion';
import { Character } from '../Character';

@Component({
    selector: 'app-proficiency-form',
    templateUrl: './proficiency-form.component.html',
    styleUrls: ['./proficiency-form.component.css'],
    changeDetection: ChangeDetectionStrategy.Default
})
export class ProficiencyFormComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    skill: Skill;
    @Input()
    characterService: CharacterService;
    @Input()
    level: number;

    constructor(
        private changeDetector: ChangeDetectorRef
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character | AnimalCompanion;
    }

    get_ProficiencyLevel() {
        return this.skill.level(this.get_Creature(), this.characterService, this.level);
    }

    ngOnInit() {
        this.characterService.get_Changed()
            .subscribe((target) => {
                if (["individualskills", "all", this.creature, this.skill.name].includes(target)) {
                    this.changeDetector.detectChanges()
                }
            });
        this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature &&
                    (
                        view.target == "all" ||
                        (view.target == "individualskills" && [this.skill.name, this.skill.ability, "all"].includes(view.subtarget))
                    )) {
                    this.changeDetector.detectChanges()
                }
            });
    }

}
