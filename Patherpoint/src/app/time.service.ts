import { Injectable } from '@angular/core';
import { ConditionsService } from './Conditions.service';
import { CharacterService } from './character.service';
import { ActivitiesService } from './activities.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';

@Injectable({
    providedIn: 'root'
})
export class TimeService {

    //yourTurn is 5 if it is your turn or 0 otherwise
    private yourTurn: number = 0;

    constructor(
        private conditionsService: ConditionsService,
        private activitiesService: ActivitiesService
    ) { }

    get_YourTurn() {
        return this.yourTurn;
    }

    start_Turn(characterService: CharacterService, effectsService: EffectsService) {
        
        //Fast Healing
        let fastHealing: number = 0;
        characterService.get_Creatures().forEach(creature => {
            effectsService.get_EffectsOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
                fastHealing += parseInt(effect.value);
            })
            if (fastHealing && creature.health.currentHP(creature, characterService, effectsService) > 0) {
                creature.health.heal(creature, characterService, effectsService, fastHealing);
            }
        })

        this.tick(characterService, 5);
    }

    end_Turn(characterService: CharacterService) {
        this.tick(characterService, 5);
    }

    tick(characterService: CharacterService, turns: number = 10) {
        this.conditionsService.tick_Conditions(characterService.get_Character(), turns, this.yourTurn);
        this.conditionsService.tick_Conditions(characterService.get_Companion(), turns, this.yourTurn);
        this.activitiesService.tick_Activities(characterService.get_Character(), characterService, turns);
        this.activitiesService.tick_Activities(characterService.get_Companion(), characterService, turns);
        this.yourTurn = (this.yourTurn + turns) % 10;
        characterService.set_Changed();
    }

    get_Duration(duration) {
        let durationNum = duration;
        let returnString: string = ""
        if (durationNum / 144000 >= 1) {
            returnString += Math.floor(durationNum / 144000)+" Day"
            if (durationNum / 144000 >= 2) { returnString += "s" }
            durationNum %= 144000;
        }
        if (durationNum / 6000 >= 1) {
            returnString += " "+Math.floor(durationNum / 6000)+" Hour"
            if (durationNum / 6000 >= 2) { returnString += "s" }
            durationNum %= 6000;
        }
        if (durationNum / 100 >= 1) {
            returnString += " "+Math.floor(durationNum / 100)+" Minute"
            if (durationNum / 100 >= 2) { returnString += "s" }
            durationNum %= 100;
        }
        if (durationNum >= 10) {
            returnString += " "+Math.floor(durationNum / 10)+" Turn"
            if (durationNum / 10 > 1) { returnString += "s" }
            durationNum %= 10;
        }
        return returnString;
    }

}
