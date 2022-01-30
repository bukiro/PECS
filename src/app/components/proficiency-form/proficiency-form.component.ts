import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Skill } from 'src/app/classes/Skill';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

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
        private changeDetector: ChangeDetectorRef,
        private refreshService: RefreshService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_Levels() {
        return [
            { value: 2, key: "T", title: "Trained" },
            { value: 4, key: "E", title: "Expert" },
            { value: 6, key: "M", title: "Master" },
            { value: 8, key: "L", title: "Legendary" }
        ]
    }

    get_ProficiencyLevel() {
        return this.skill.level(this.get_Creature(), this.characterService, this.level, this.excludeTemporary);
    }

    finish_loading() {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (["individualskills", "all", this.creature.toLowerCase(), this.skill.name.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges()
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
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

    ngOnInit() {
        this.finish_loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
