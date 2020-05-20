import { Injectable } from '@angular/core';
import { ConditionsService } from './Conditions.service';
import { CharacterService } from './character.service';
import { ActivitiesService } from './activities.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { AbilitiesService } from './abilities.service';

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
            effectsService.get_AbsolutesOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
                fastHealing = parseInt(effect.setValue);
            })
            effectsService.get_RelativesOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
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

    rest(characterService: CharacterService) {
        let charLevel: number = characterService.get_Character().level;
        characterService.get_Creatures().forEach(creature => {
            let con = 1;
            if (creature.type != "Familiar") {
                con = Math.max(characterService.abilitiesService.get_Abilities("Constitution")[0].mod(creature, characterService, characterService.effectsService).result, 1);
            }
            characterService.get_Health(creature).heal(creature, characterService, characterService.effectsService, con * charLevel, true, true);
            if (characterService.get_Health(creature).damage == 0) {
                characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => characterService.remove_Condition(creature, gain));
            }
            characterService.get_AppliedConditions(creature, "Fatigued").forEach(gain => characterService.remove_Condition(creature, gain));
            characterService.get_AppliedConditions(creature, "Doomed").forEach(gain => {gain.value -= 1});
            characterService.get_AppliedConditions(creature, "Drained").forEach(gain => {gain.value -= 1});
        });
        characterService.get_Character().class.spellCasting.forEach(casting => {
            casting.spellSlotsUsed = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        });
        this.tick(characterService, 48000);
        //insert cooldown reset here
    }

    tick(characterService: CharacterService, turns: number = 10) {
        characterService.get_Creatures().forEach(creature => {
            this.conditionsService.tick_Conditions(creature, turns, this.yourTurn);
            this.activitiesService.tick_Activities(creature, characterService, turns);
            if (turns >= 1000 && characterService.get_Health(creature).damage == 0) {
                characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => characterService.remove_Condition(creature, gain));
            }
            if (creature.type != "Familiar") {
                characterService.tick_Oils(creature, turns);
            }
        })
        this.yourTurn = (this.yourTurn + turns) % 10;
        characterService.set_Changed();
    }

    get_Duration(duration: number) {
        if (duration == -1) {
            return "Permanent";
        }
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
        return returnString.trim();
    }

}
