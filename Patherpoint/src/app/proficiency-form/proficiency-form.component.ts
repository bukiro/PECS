import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
    @Input()
    excludeTemporary: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character | AnimalCompanion;
    }

    get_Levels() {
        return [
            {value:2, key:"T", title:"Trained"},
            {value:4, key:"E", title:"Expert"},
            {value:6, key:"M", title:"Master"},
            {value:8, key:"L", title:"Legendary"}
        ]
    }

    get_ProficiencyLevel() {
        return this.skill.level(this.get_Creature(), this.characterService, this.level, this.excludeTemporary);
    }

    ngOnInit() {
        this.characterService.get_Changed()
            .subscribe((target) => {
                if (["individualskills", "all", this.creature.toLowerCase(), this.skill.name.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges()
                }
            });
        this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature &&
                    (
                        view.target == "all" ||
                        (view.target.toLowerCase() == "individualskills" && [this.skill.name.toLowerCase(), this.skill.ability.toLowerCase(), "all"].includes(view.subtarget.toLowerCase()))
                    )) {
                    this.changeDetector.detectChanges()
                }
            });
    }

}
