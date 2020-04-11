import { Injectable } from '@angular/core';
import { Condition } from './Condition';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConditionGain } from './ConditionGain';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { SortByPipe } from './sortBy.pipe';

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    private conditions: Condition[];
    private loader;
    private loading: boolean = false;
    private appliedConditions: ConditionGain[] = [];

    constructor(
        private http: HttpClient,
        private sortByPipe: SortByPipe
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

    get_AppliedConditions(characterService: CharacterService, activeConditions: ConditionGain[]) {
        if (JSON.stringify(activeConditions) == JSON.stringify(this.appliedConditions)) {
            return this.sortByPipe.transform(activeConditions, "asc", "duration");
        } else {
            let overrides: string[] = [];
            activeConditions.forEach(gain => {
                let originalCondition = this.get_Conditions(gain.name);
                if (originalCondition.length) {
                    overrides.push(...originalCondition[0].overrideConditions);
                }
            });
            activeConditions.forEach(gain => {
                let condition = this.get_Conditions(gain.name)[0];
                //Mark any conditions for deletion that can have a value if their value is 0 or lower, or if their duration is 0
                //Only process the rest
                if ((condition.hasValue && gain.value <= 0) || gain.duration == 0) {
                    gain.value = -1;
                } else {
                    gain.apply = true;
                    if (overrides.indexOf(gain.name) > -1 || (overrides.indexOf("All") > -1 && condition.overrideConditions.indexOf("All") == -1)) {
                        gain.apply = false;
                    }
                    //We compare this condition with all others that have the same name and deactivate it under certain circumstances
                    //Are there any other conditions with this name and value that have not been deactivated yet?
                    activeConditions.filter(otherGain => 
                        (otherGain !== gain) &&
                        (otherGain.name == gain.name) &&
                        (otherGain.apply)
                        ).forEach(otherGain => {
                            //Higher value conditions remain.
                            if (otherGain.value > gain.value) {
                                gain.apply = false;
                            } else if (otherGain.value == gain.value || (!otherGain.value && !gain.value)) {
                                //If the value is the same:
                                //Deactivate this condition if the other one has a longer duration (and this one is not permanent), or is permanent (no matter if this one is)
                                //The other condition will not be deactivated because it only gets compared to the ones that aren't deactivated yet
                                if (otherGain.duration == -1 || (gain.duration >= 0 && otherGain.duration >= gain.duration)) {
                                    gain.apply = false;
                                }
                            }
                        })
                }
            })
            for (let index = activeConditions.length; index > 0; index--) {
                let gain = activeConditions[index-1];
                if (gain.value == -1) {
                    characterService.remove_Condition(gain, false);
                }
            }
            this.appliedConditions = [];
            this.appliedConditions = activeConditions.map(gain => Object.assign(new ConditionGain(), gain));
            return this.sortByPipe.transform(activeConditions, "asc", "duration");
        }
    }

    process_Condition(characterService: CharacterService, effectsService: EffectsService, gain: ConditionGain, condition: Condition, taken: boolean, increaseWounded: boolean = true) {

        let character = characterService.get_Character();
        //Use gain once so it isn't marked as unused. It will be used by the eval strings.
        gain = gain
            //One time effects
            if (condition.onceEffects) {
                if (taken) {
                    condition.onceEffects.forEach(effect => {
                        characterService.process_OnceEffect(effect);
                    })
                }
            }

        if (gain.name == "Dying") {
            if (taken) {
                if (characterService.get_Health().dying(characterService) >= characterService.get_Health().maxDying(effectsService)) {
                    if (characterService.get_AppliedConditions("Dead").length == 0) {
                        characterService.add_Condition(Object.assign(new ConditionGain, {name:"Dead", source:"Failed Dying Save"}), false)
                    }
                }
            } else {
                if (characterService.get_Health().dying(characterService) == 0) {
                    if (increaseWounded) {
                        if (characterService.get_Health().wounded(characterService) > 0) {
                            characterService.get_AppliedConditions("Wounded").forEach(gain => {
                                gain.value += 1
                                gain.source = "Recovered from Dying";
                            });
                        } else {
                            characterService.add_Condition(Object.assign(new ConditionGain, {name:"Wounded", value:1, source:"Recovered from Dying"}), false)
                        }
                    }
                    if (characterService.get_Health().currentHP(characterService, effectsService) == 0) {
                        if (characterService.get_AppliedConditions("Unconscious", "0 Hit Points").length == 0) {
                            characterService.add_Condition(Object.assign(new ConditionGain, {name:"Unconscious", source:"0 Hit Points"}), false)
                        }
                    }
                }
            }
        }

    }

    tick_Conditions(characterService: CharacterService, turns: number = 10, yourTurn: number) {
        let activeConditions = characterService.get_Character().conditions;
        while (turns > 0) {
            let activeConditions = characterService.get_Character().conditions;
            activeConditions = this.sortByPipe.transform(activeConditions, "asc", "duration");
            if (activeConditions.filter(gain => gain.duration > 0).length || activeConditions.filter(gain => gain.decreasingValue).length) {
                //Get the first condition that will run out
                let first: number;
                if (activeConditions.filter(gain => gain.duration > 0).length) {
                    first = activeConditions.filter(gain => gain.duration > 0)[0].duration;
                }
                //If any condition has a decreasing Value per round, step 5 (to the end of the Turn) if it is your Turn or 10 (1 turn) at most
                if (activeConditions.filter(gain => gain.decreasingValue).length) {
                    if (yourTurn == 5) {
                        first = 5;
                    } else {
                        first = 10;
                    }
                }
                //Either to the next condition to run out or decrease their value or step the given turns, whichever comes first
                let difference = Math.min(first, turns);
                activeConditions.filter(gain => gain.duration > 0).forEach(gain => {
                    gain.duration -= difference;
                });
                //If any conditions have their value decreasing, do this now.
                if ((yourTurn == 5 && difference == 5) || (yourTurn == 0 && difference == 10)) {
                    activeConditions.filter(gain => gain.decreasingValue).forEach(gain => {
                        gain.value--;
                    });
                }
                turns -= difference;
            } else {
                turns = 0;
            }
        }
        characterService.get_Character().conditions = activeConditions;
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