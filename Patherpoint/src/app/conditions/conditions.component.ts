import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { ConditionGain } from '../ConditionGain';
import { ConditionsService } from '../Conditions.service';
import { Condition } from '../Condition';

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsComponent implements OnInit {

    public value: number = 1;
    public showItem: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private traitsService: TraitsService,
        private conditionsService: ConditionsService
    ) { }

    toggle(type) {
        if (this.showItem == type) {
            this.showItem = "";
        } else {
            this.showItem = type;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    still_loading() {
        return this.conditionsService.still_loading() || this.characterService.still_loading();
    }

    toggleConditionsMenu() {
        this.characterService.toggleMenu("conditions");
    }

    get_ConditionsSet(type: string) {
        switch (type) {
            case "Generic":
                return this.get_Conditions("", "generic");
            case "Alchemical Elixirs":
                return this.get_Conditions("", "alchemicalelixirs");
        }
    }
    
    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Conditions(name: string = "", type: string = "") {
        return this.conditionsService.get_Conditions(name, type);
    }

    add_Condition(condition: Condition, duration: number) {
        let newGain = new ConditionGain;
        newGain.name = condition.name;
        newGain.duration = duration;
        if (condition.hasValue) {
            newGain.value = this.value;
        }
        newGain.source = "Manual";
        let conditions = this.characterService.get_Character().conditions.filter(existingCondition => 
            (existingCondition.name == newGain.name) &&
            (existingCondition.value == newGain.value) &&
            ( (newGain.duration != -1) ? (existingCondition.duration != -1) : true )
            );
        if (conditions.length) {
            conditions[0].duration += duration;
            conditions[0].source = "Manual";
        } else {
            this.characterService.add_Condition(newGain, true);
        }
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
