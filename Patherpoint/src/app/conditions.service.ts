import { Injectable } from '@angular/core';
import { Condition } from './Condition';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConditionGain } from './ConditionGain';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { SortByPipe } from './sortBy.pipe';
import { Character } from './Character';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { ActivityGain } from './ActivityGain';
import { Creature } from './Creature';

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    private conditions: Condition[];
    private loader;
    private loading: boolean = false;
    private appliedConditions: ConditionGain[][] = [[], [], []];

    constructor(
        private http: HttpClient,
        private sortByPipe: SortByPipe
    ) { }

    get_Conditions(name: string = "", type: string = "") {
        if (!this.still_loading()) {
            return this.conditions.filter(condition =>
                (condition.name.toLowerCase() == name.toLowerCase() || name == "") &&
                (condition.type.toLowerCase() == type.toLowerCase() || type == "")
            );
        } else {
            return [new Condition()];
        }
    }

    get_CalculatedIndex(creature: string) {
        switch (creature) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
            case "Familiar":
                return 2;
        }
    }

    get_AppliedConditions(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, activeConditions: ConditionGain[]) {
        let creatureIndex: number = this.get_CalculatedIndex(creature.type);
        if (JSON.stringify(activeConditions) == JSON.stringify(this.appliedConditions[creatureIndex])) {
            return this.sortByPipe.transform(activeConditions, "asc", "duration") as ConditionGain[];
        } else {
            let overrides: string[] = [];
            activeConditions.forEach(gain => {
                let originalCondition = this.get_Conditions(gain.name);
                if (originalCondition.length) {
                    overrides.push(...originalCondition[0].overrideConditions);
                }
                gain.apply = true;
            });
            activeConditions.forEach(gain => {
                let condition = this.get_Conditions(gain.name)[0];
                if (condition) {
                    //Mark any conditions for deletion that can have a value if their value is 0 or lower, or if their duration is 0
                    //Only process the rest
                    if ((condition.hasValue && gain.value <= 0) || gain.duration == 0) {
                        gain.value = -1;
                    } else {
                        if (overrides.includes(gain.name) || (overrides.includes("All") && !condition.overrideConditions.includes("All"))) {
                            gain.apply = false;
                        }
                        //We compare this condition with all others that have the same name and deactivate it under certain circumstances
                        //Are there any other conditions with this name and value that have not been deactivated yet?
                        activeConditions.filter(otherGain =>
                            (otherGain !== gain) &&
                            (otherGain.name == gain.name) &&
                            (otherGain.apply)
                        ).forEach(otherGain => {
                            //Higher value conditions remain, same persistent damage value are exclusive.
                            if (otherGain.value > gain.value) {
                                gain.apply = false;
                            } else if (
                                    otherGain.choice == gain.choice &&
                                    otherGain.value == gain.value
                                ) {
                                //If the value and choice is the same:
                                //Deactivate this condition if the other one has a longer duration (and this one is not permanent), or is permanent (no matter if this one is)
                                //The other condition will not be deactivated because it only gets compared to the ones that aren't deactivated yet
                                if (otherGain.duration == -1 || (gain.duration >= 0 && otherGain.duration >= gain.duration)) {
                                    gain.apply = false;
                                }
                            }
                        })
                    }
                }
            })
            //Remove all conditions that were marked for deletion by setting its value to -1. We use while so we don't mess up the index.
            while (activeConditions.filter(gain => gain.value == -1).length) {
                characterService.remove_Condition(creature, activeConditions.filter(gain => gain.value == -1)[0], false);
            }
            this.appliedConditions[creatureIndex] = [];
            this.appliedConditions[creatureIndex] = activeConditions.map(gain => Object.assign(new ConditionGain(), gain));
            return this.sortByPipe.transform(this.sortByPipe.transform(activeConditions, "asc", "name"), "asc", "duration") as ConditionGain[];
        }
    }

    process_Condition(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, effectsService: EffectsService, gain: ConditionGain, condition: Condition, taken: boolean, increaseWounded: boolean = true) {

        //Prepare components for refresh
        if (condition.gainActivities.length) {
            characterService.set_ToChange(creature.type, "activities");
        }
        if (condition.showon) {
            characterService.set_TagsToChange(creature.type, condition.showon);
        }

        //Copy the condition's ActivityGains to the ConditionGain so we can track its duration, cooldown etc.
        gain.gainActivities = condition.gainActivities.map(activityGain => Object.assign(new ActivityGain(), JSON.parse(JSON.stringify(activityGain))));

        gain.onset = condition.onset;
        
        //One time effects
        if (condition.onceEffects.length) {
            if (taken) {
                condition.onceEffects.forEach(effect => {
                    characterService.process_OnceEffect(creature, effect, gain.value, gain.heightened);
                })
            }
        }

        //One time effects when ending the condition
        if (condition.endEffects.length) {
            if (!taken) {
                condition.endEffects.forEach(effect => {
                    characterService.process_OnceEffect(creature, effect, gain.value, gain.heightened);
                })
            }
        }

        //Remove other conditions if applicable
        if (taken) {
            condition.endConditions.forEach(end => {
                characterService.get_AppliedConditions(creature, end).forEach(gain => {
                    characterService.remove_Condition(creature, gain, false);
                })
            })
        }
        
        //Stuff that happens when your Dying value is raised or lowered beyond a limit.
        if (gain.name == "Dying") {
            if (taken) {
                if (creature.health.dying(creature, characterService) >= creature.health.maxDying(creature, effectsService)) {
                    if (characterService.get_AppliedConditions(creature, "Dead").length == 0) {
                        characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Dead", source: "Dying value too high" }), false)
                    }
                }
            } else {
                if (creature.health.dying(creature, characterService) == 0) {
                    if (increaseWounded) {
                        if (creature.health.wounded(creature, characterService) > 0) {
                            characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => {
                                gain.value += 1
                                gain.source = "Recovered from Dying";
                            });
                        } else {
                            characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Wounded", value: 1, source: "Recovered from Dying" }), false)
                        }
                    }
                    if (creature.health.currentHP(creature, characterService, effectsService).result == 0) {
                        if (characterService.get_AppliedConditions(creature, "Unconscious", "0 Hit Points").length == 0) {
                            characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Unconscious", source: "0 Hit Points" }), false)
                        }
                    }
                }
            }
        }

        if (condition.senses) {
            characterService.set_ToChange(creature.type, "skills");
        }

    }

    tick_Conditions(creature: Character|AnimalCompanion|Familiar, turns: number = 10, yourTurn: number) {
        let activeConditions = creature.conditions;
        while (turns > 0) {
            let activeConditions = creature.conditions;
            activeConditions = activeConditions.sort(function(a,b) {
                let compareA: number[] = [];
                if (a.nextStage > 0) {compareA.push(a.nextStage);}
                if (a.duration > 0) {compareA.push(a.duration);}
                let compareB: number[] = [];
                if (b.nextStage > 0) {compareB.push(b.nextStage);}
                if (b.duration > 0) {compareB.push(b.duration);}
                if (!compareA.length) {
                    return 1
                } else if (!compareA.length) {
                    return -1
                } else {
                    return Math.min(...compareA) - Math.min(...compareB)
                }
            });
            if (activeConditions.filter(gain => (gain.duration > 0 && !gain.onset) || gain.nextStage > 0).length || activeConditions.filter(gain => gain.decreasingValue).length) {
                //Get the first condition that will run out
                let first: number;
                //If any condition has a decreasing Value per round, step 5 (to the end of the Turn) if it is your Turn or 10 (1 turn) at most
                //Otherwise find the next step from either the duration or the nextStage of the first gain of the sorted list.
                if (activeConditions.filter(gain => gain.decreasingValue).length) {
                    if (yourTurn == 5) {
                        first = 5;
                    } else {
                        first = 10;
                    }
                } else {
                    if (activeConditions.filter(gain => (gain.duration > 0 && !gain.onset) || gain.nextStage > 0).length) {
                        let firstObject: ConditionGain = activeConditions.filter(gain => gain.duration > 0 || gain.nextStage > 0)[0]
                        let durations: number[] = [];
                        if (firstObject.duration > 0 && !firstObject.onset) {durations.push(firstObject.duration);}
                        if (firstObject.nextStage > 0) {durations.push(firstObject.nextStage);}
                        first = Math.min(...durations);
                    }
                }
                //Either to the next condition to run out or decrease their value or step the given turns, whichever comes first
                let step = Math.min(first, turns);
                activeConditions.filter(gain => gain.duration > 0 && !gain.onset).forEach(gain => {
                    gain.duration -= step;
                });
                activeConditions.filter(gain => gain.nextStage > 0).forEach(gain => {
                    gain.nextStage -= step;
                    if (gain.nextStage <= 0) {
                        gain.nextStage = -1;
                    }
                });
                //If any conditions have their value decreasing, do this now.
                if ((yourTurn == 5 && step == 5) || (yourTurn == 0 && step == 10)) {
                    activeConditions.filter(gain => gain.decreasingValue).forEach(gain => {
                        gain.value--;
                    });
                }
                turns -= step;
            } else {
                turns = 0;
            }
        }
        creature.conditions = activeConditions;
    }

    rest(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService) {
        creature.conditions.filter(gain => gain.duration == -2).forEach(gain => {
            gain.duration = 0;
        });
    }

    still_loading() {
        return (this.loading);
    }

    load_Conditions(): Observable<string[]> {
        return this.http.get<string[]>('/assets/conditions.json');
    }

    initialize() {
        if (!this.conditions) {
            this.loading = true;
            this.load_Conditions()
                .subscribe((results: String[]) => {
                    this.loader = results;
                    this.finish_loading()
                });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.conditions = this.loader.map(condition => Object.assign(new Condition(), condition));

            //Don't reassign conditions because they don't have changing parts and never get stored in the Character

            this.loader = [];
        }
        if (this.loading) { this.loading = false; }
    }

}