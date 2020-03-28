import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { SkillsService } from '../skills.service';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public skillsService: SkillsService,
    ) { }

    minimize() {
        this.characterService.get_Character().settings.skillsMinimized = !this.characterService.get_Character().settings.skillsMinimized;
    }

    set_Span() {
        setTimeout(() => {
            document.getElementById("skills").style.gridRow = "span "+this.characterService.get_Span("skills-height");
        })
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type);
    }

    get_Accent() {
        return this.characterService.get_Accent();
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