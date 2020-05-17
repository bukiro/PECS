import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Effect } from '../Effect';

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagsComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    objectName: string = "";
    @Input()
    showTraits:boolean = false;
    @Input()
    showFeats:boolean = false;
    @Input()
    showItems:boolean = false;
    @Input()
    showActivities:boolean = false;
    @Input()
    showConditions:boolean = false;
    @Input()
    showEffects:boolean = false;
    @Input()
    specialNames:string[] = [];
    @Input()
    specialEffects:Effect[] = []

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private effectsService: EffectsService
    ) { }
    
    still_loading() {
        return this.characterService.still_loading();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_TraitsForThis(name: string) {
        if (this.showTraits && name) {
            return this.traitsService.get_TraitsForThis(this.get_Creature(), name);
        } else {
            return [];
        }
    }

    get_FeatsShowingOn(name: string, show: boolean ) {
        if (show && name && this.creature == "Character") {
            return this.characterService.get_FeatsShowingOn(name);
        } else if (show && name && this.creature == "Companion") {
            return this.characterService.get_CompanionShowingOn(name);
        } else if (show && name && this.creature == "Familiar") {
            return this.characterService.get_FamiliarShowingOn(name);
        } else {
            return [];
        }
    }

    get_EffectsOnThis(name: string) {
        if (this.showEffects && name) {
            return this.effectsService.get_EffectsOnThis(this.get_Creature(), name);
        } else {
            return [];
        }
    }

    get_ConditionsShowingOn(name: string) {
        if (this.showConditions && name) {
            return this.characterService.get_ConditionsShowingOn(this.get_Creature(), name);
        } else {
            return [];
        }
    }
    
    get_ActivitiesShowingOn(name: string) {
        if (this.showActivities && name) {
            return this.characterService.get_ActivitiesShowingOn(this.get_Creature(), name);
        } else {
            return [];
        }
    }

    get_ItemsShowingOn(name: string) {
        if (this.showItems && name) {
            return this.characterService.get_ItemsShowingOn(this.get_Creature(), name);
        } else {
            return [];
        }
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["tags", "all", this.creature].includes(target)) {
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
