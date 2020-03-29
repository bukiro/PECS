import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { SkillsService } from '../skills.service';
import { ChildrenOutletContexts } from '@angular/router';
import { FeatsService } from '../feats.service';
import { Feat } from '../Feat';

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
        public featsService: FeatsService
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

    get_Senses() {
        let senses: string[] = [];
        let character = this.characterService.get_Character()
        let ancestrySenses = character.class.ancestry.senses
        let heritageSenses = character.class.heritage.senses
        if (ancestrySenses.length) {
            senses.push(ancestrySenses)
        }
        if (heritageSenses.length) {
            senses.push(heritageSenses)
        }
        this.characterService.get_Character().get_FeatsTaken(0, character.level).filter(feat => feat.senses).forEach(feat => {
            senses.push(feat.senses)
        });
        return senses;
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