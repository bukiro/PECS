import { Component, OnInit, Input } from '@angular/core';
import { Activity } from '../Activity';
import { TraitsService } from '../traits.service';

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {

    @Input()
    activity: Activity;

    constructor(
        private traitsService: TraitsService
    ) { }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
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

    ngOnInit() {
    }

}
