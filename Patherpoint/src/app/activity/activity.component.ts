import { Component, OnInit, Input } from '@angular/core';
import { Activity } from '../Activity';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {

    @Input()
    activity: Activity;

    constructor(
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private effectsService: EffectsService
    ) { }

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

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    get_EffectsOnThis(ObjectName: String) {
        return this.effectsService.get_EffectsOnThis(ObjectName);
    }

    get_ConditionsShowingOn(name: string) {
        return this.characterService.get_ConditionsShowingOn(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    ngOnInit() {
    }

}
