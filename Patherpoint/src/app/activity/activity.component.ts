import { Component, OnInit, Input } from '@angular/core';
import { Activity } from '../Activity';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { ActivitiesService } from '../activities.service';
import { TimeService } from '../time.service';
import { ItemsService } from '../items.service';
import { ActivityGain } from '../ActivityGain';
import { ItemActivity } from '../ItemActivity';

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {

    @Input()
    activity: Activity|ItemActivity;
    @Input()
    gain: ActivityGain|ItemActivity;
    @Input()
    allowActivate: boolean = false;

    constructor(
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService,
        private itemsService: ItemsService
        
    ) { }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_ActivationTraits(activity: Activity) {
        switch (activity.activationType) {
            case "Command": 
                return ["Auditory", "Concentrate"];
            case "Envision": 
                return ["Concentrate"];
            case "Interact": 
                return ["Manipulate"];
            default:
                return [];
        }
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    on_Activate(gain: ActivityGain|ItemActivity, activity: Activity|ItemActivity, activated: boolean) {
        this.activitiesService.activate_Activity(this.characterService, this.timeService, this.itemsService, gain, activity, activated);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    ngOnInit() {
    }

}
