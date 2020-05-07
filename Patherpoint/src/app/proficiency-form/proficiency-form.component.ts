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
    changeDetection: ChangeDetectionStrategy.OnPush
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
    proficiencyGroup: FormGroup;
    skillLevel:number = 0;

    constructor(
        private formBuilder: FormBuilder,
        private changeDetector: ChangeDetectorRef
    ) { }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character|AnimalCompanion;
    }

    ngOnInit() {
        this.proficiencyGroup = this.formBuilder.group({
            proficiencyLevel: [{value: this.skill.level(this.get_Creature(), this.characterService, this.level), disabled: true}]
        });
        this.characterService.characterChanged$
        .subscribe(() => {
        this.proficiencyGroup.patchValue({proficiencyLevel: this.skill.level(this.get_Creature(), this.characterService, this.level)});
        this.changeDetector.detectChanges()
        })
    }

}
