import { Injectable } from '@angular/core';
import { Condition } from './Condition';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConditionGain } from './ConditionGain';
import { CharacterService } from './character.service';

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    private conditions: Condition[];
    private loader;
    private loading: boolean = false;

    constructor(
        private http: HttpClient
    ) { }

    get_Conditions(name: string = "", type: string = "") {
        if (!this.still_loading()) {
            return this.conditions.filter(condition =>
                (condition.name == name || name == "") &&
                (condition.type == type || type == "")
                );
        } else {
            return [new Condition()];
        }
    }

    get_AppliedConditions(activeConditions: ConditionGain[]) {
        let overrides: string[] = [];
        activeConditions.forEach(condition => {
            let originalCondition = this.get_Conditions(condition.name);
            if (originalCondition.length) {
                overrides.push(...originalCondition[0].overrideConditions);
            }
        });
        activeConditions.forEach(condition => {
            condition.apply = true;
            if (overrides.indexOf(condition.name) > -1 || (overrides.indexOf("All") > -1 && this.get_Conditions(condition.name)[0].overrideConditions.indexOf("All") == -1)) {
                condition.apply = false;
            }
            //We compare this condition with all others that have the same name and deactivate it under certain circumstances
            //Are there any other conditions with this name and value that have not been deactivated yet?
            activeConditions.filter(otherCondition => 
                (otherCondition !== condition) &&
                (otherCondition.name == condition.name) &&
                (otherCondition.apply)
                ).forEach(otherCondition => {
                    //Higher value conditions remain.
                    if (otherCondition.value > condition.value) {
                        condition.apply = false;
                    } else if (otherCondition.value == condition.value || (!otherCondition.value && !condition.value)) {
                        //If the value is the same:
                        //Deactivate this condition if the other one has a longer duration (and this one is not permanent), or is permanent (no matter if this one is)
                        //The other condition will not be deactivated because it only gets compared to the ones that aren't deactivated yet
                        if (otherCondition.duration == -1 || (condition.duration >= 0 && otherCondition.duration >= condition.duration)) {
                            condition.apply = false;
                        }
                    }
                })
        })
        return activeConditions;
    }

    process_Condition(characterService: CharacterService, gain: ConditionGain, condition: Condition, taken: boolean) {

        let character = characterService.get_Character();
        //Use gain once so it isn't marked as unused. It will be used by the eval strings.
        gain = gain
            //One time effects
            if (condition.onceEffects) {
                if (taken) {
                    condition.onceEffects.forEach(effect => {
                        switch (effect.affected) {
                            case "Temporary HP":
                                character.health.temporaryHP += parseInt(eval(effect.value));
                                break;
                            case "Dying":
                                character.health.dying = parseInt(eval(effect.value));
                                break;
                            case "Wounded":
                                character.health.wounded = parseInt(eval(effect.value));
                                break;
                        }
                    })
                }
            }

    }

    still_loading() {
        return (this.loading);
    }

    load_Conditions(): Observable<String[]>{
        return this.http.get<String[]>('/assets/conditions.json');
    }

    initialize() {
        if (!this.conditions) {
        this.loading = true;
        this.load_Conditions()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.conditions = this.loader.map(condition => Object.assign(new Condition(), condition));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
