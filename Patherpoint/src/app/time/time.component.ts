import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { TimeService } from '../time.service';
import { EffectsService } from '../effects.service';

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
        private effectsService: EffectsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.timeMinimized = !this.characterService.get_Character().settings.timeMinimized;
    }
    
    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span("time");
        })
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    get_Duration(duration) {
        return this.timeService.get_Duration(duration);
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_YourTurn() {
        return this.timeService.get_YourTurn();
    }

    start_Turn() {
        this.timeService.start_Turn(this.characterService, this.effectsService);
    }

    end_Turn() {
        this.timeService.end_Turn(this.characterService);
    }

    tick(amount: number) {
        this.timeService.tick(this.characterService, amount);
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
