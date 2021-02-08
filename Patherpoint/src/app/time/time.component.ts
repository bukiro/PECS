import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { TimeService } from '../time.service';
import { EffectsService } from '../effects.service';
import { ItemsService } from '../items.service';
import { SpellsService } from '../spells.service';
import { ConditionsService } from '../conditions.service';

@Component({
    selector: 'app-time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private spellsService: SpellsService,
        private effectsService: EffectsService,
        private conditionsService: ConditionsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.timeMinimized = !this.characterService.get_Character().settings.timeMinimized;
    }
    
    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span("time", 1);
        })
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Duration(duration: number, includeTurnState: boolean = true) {
        return this.timeService.get_Duration(duration, includeTurnState);
    }

    get_Waiting(duration: number) {
        let result: string = "";
        this.characterService.get_Creatures().forEach(creature => {
            if (this.characterService.get_AppliedConditions(creature, "", "", true).some(gain => (gain.nextStage < duration && gain.nextStage > 0) || gain.nextStage == -1)) {
                result = "One or more conditions" + (creature.type != "Character" ? " on your " + creature.type : "") + " need your attention before this time.";
            }
            if (this.characterService.get_AppliedConditions(creature, "", "", true).some(gain => (gain.duration == 1))) {
                result = "One or more instant effects" + (creature.type != "Character" ? " on your " + creature.type : "") + " need to be resolved before you can continue.";
            }
            if (this.characterService.get_Health(creature).temporaryHP.length > 1) {
                result = "You need to select one set of temporary Hit Points" + (creature.type != "Character" ? " on your " + creature.type : "") + " before you can continue.";
            }
        })
        return result;
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_YourTurn() {
        return this.timeService.get_YourTurn();
    }

    start_Turn() {
        this.timeService.start_Turn(this.characterService, this.conditionsService, this.itemsService, this.spellsService, this.effectsService);
    }

    end_Turn() {
        this.timeService.end_Turn(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    tick(amount: number) {
        this.timeService.tick(this.characterService, this.conditionsService, this.itemsService, this.spellsService, amount);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["time", "all", "Character"].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == "Character" && ["time", "all"].includes(view.target)) {
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
