import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { AbilitiesService} from '../abilities.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { Creature } from '../Creature';
import { AnimalCompanion } from '../AnimalCompanion';
import { Character } from '../Character';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitiesComponent implements OnInit {
    
    @Input()
    public creature: string = "Character";
    @Input()
    public sheetSide: string = "left";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public abilitiesService: AbilitiesService,
        public characterService: CharacterService,
        public effectsService: EffectsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.abilitiesMinimized = !this.characterService.get_Character().settings.abilitiesMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.abilitiesMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
        }
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_CalculatedIndex() {
        switch (this.creature) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
        }
    }

    get_Abilities(subset: number = 0) {
        switch (subset) {
            case 0:
                return this.abilitiesService.get_Abilities();
            case 1:
                return this.abilitiesService.get_Abilities().filter((ability, index) => index <= 2);
            case 2:
                return this.abilitiesService.get_Abilities().filter((ability, index) => index >= 3);
        }
        
    }
    
    still_loading() {
        return this.abilitiesService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["abilities", "all", this.creature].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["abilities", "all"].includes(view.target)) {
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
