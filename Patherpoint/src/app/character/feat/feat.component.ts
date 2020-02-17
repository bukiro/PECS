import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CharacterComponent } from '../character.component';
import { CharacterService } from 'src/app/character.service';
import { ClassesService } from 'src/app/classes.service';
import { AbilitiesService } from 'src/app/abilities.service';
import { EffectsService } from 'src/app/effects.service';
import { FeatsService } from 'src/app/feats.service';
import { Level } from 'src/app/Level';
import { Feat } from 'src/app/Feat';

@Component({
    selector: 'app-feat',
    templateUrl: './feat.component.html',
    styleUrls: ['./feat.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatComponent implements OnInit {

    @Input()
    feat: Feat;
    @Input()
    level: Level;
    @Input()
    type: string;

    constructor(
        public characterComponent: CharacterComponent,
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public classesService: ClassesService,
        public abilitiesService: AbilitiesService,
        public effectsService: EffectsService,
        public featsService: FeatsService,
    ) { }

    toggle_Item(name: string) {
        this.characterComponent.toggle_Item(name)
    }

    get_showItem() {
        return this.characterComponent.get_showItem();
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string, source: string = "") {
        return this.characterService.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber, featName, source);
    }

    onFeatTaken(level: Level, featName: string, type: string, take: boolean, source: string) {
        this.characterService.get_Character().takeFeat(this.characterService, level, featName, type, take, source);
    }

    canChoose(feat: Feat, type: string, level: Level) {
        let canChoose = feat.canChoose(this.characterService, this.abilitiesService, this.effectsService, level.number);
        let hasBeenTaken = (this.get_FeatsTaken(level.number, level.number, feat.name).length > 0);
        let allFeatsTaken = false;
        switch (type) {
            case "General":
                allFeatsTaken = (level.generalFeats_applied >= level.generalFeats_available)
                break;
            case "Skill":
                allFeatsTaken = (level.skillFeats_applied >= level.skillFeats_available)
                break;
            case "Ancestry":
                allFeatsTaken = (level.ancestryFeats_applied >= level.ancestryFeats_available)
                break;
        }
        return canChoose && !hasBeenTaken && !allFeatsTaken;
    }

    still_loading() {
        return this.characterService.still_loading();
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
