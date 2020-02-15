import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AbilitiesService} from '../abilities.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitiesComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        public abilitiesService: AbilitiesService,
        public characterService: CharacterService,
        public effectsService: EffectsService
    ) { }
  
    get_Abilities(key:string = "", value:string = "") {
        return this.abilitiesService.get_Abilities();
    }
    
    still_loading() {
        return this.abilitiesService.still_loading();
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
        this.abilitiesService.initialize();
        this.finish_Loading();
    }

}
