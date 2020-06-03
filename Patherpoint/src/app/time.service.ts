import { Injectable } from '@angular/core';
import { ConditionsService } from './conditions.service';
import { CharacterService } from './character.service';
import { ActivitiesService } from './activities.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { SpellsService } from './spells.service';
import { ItemsService } from './items.service';
import { Character } from './Character';

@Injectable({
    providedIn: 'root'
})
export class TimeService {

    //yourTurn is 5 if it is your turn or 0 otherwise
    private yourTurn: number = 0;

    constructor(
        private conditionsService: ConditionsService,
        private activitiesService: ActivitiesService,
        private spellsService: SpellsService,
        private effectsService: EffectsService
    ) { }

    get_YourTurn() {
        return this.yourTurn;
    }

    start_Turn(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, effectsService: EffectsService) {
        
        //Fast Healing
        let fastHealing: number = 0;
        characterService.get_Creatures().forEach(creature => {
            effectsService.get_AbsolutesOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
                fastHealing = parseInt(effect.setValue);
            })
            effectsService.get_RelativesOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
                fastHealing += parseInt(effect.value);
            })
            if (fastHealing && creature.health.currentHP(creature, characterService, effectsService).result > 0) {
                creature.health.heal(creature, characterService, effectsService, fastHealing);
            }
        })

        this.tick(characterService, timeService, itemsService, spellsService, 5);
    }

    end_Turn(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService) {
        this.tick(characterService, timeService, itemsService, spellsService, 5);
    }

    rest(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, ) {
        let charLevel: number = characterService.get_Character().level;
        this.tick(characterService, timeService, itemsService, spellsService, 48000);
        characterService.get_Creatures().forEach(creature => {
            let con = 1;
            if (creature.type != "Familiar") {
                con = Math.max(characterService.abilitiesService.get_Abilities("Constitution")[0].mod(creature, characterService, characterService.effectsService).result, 1);
            }
            let heal: number = con * charLevel;
            this.effectsService.get_RelativesOnThis(creature, "Resting HP Gain").forEach(effect => {
                heal += parseInt(effect.value);
            })
            characterService.get_Health(creature).heal(creature, characterService, characterService.effectsService, heal, true, true);
            //After resting with full HP, the Wounded condition is removed.
            if (characterService.get_Health(creature).damage == 0) {
                characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => characterService.remove_Condition(creature, gain));
            }
            //After resting, the Fatigued condition is removed, and the value of Doomed and Drained is reduced.
            characterService.get_AppliedConditions(creature, "Fatigued").forEach(gain => characterService.remove_Condition(creature, gain));
            characterService.get_AppliedConditions(creature, "Doomed").forEach(gain => {gain.value -= 1});
            characterService.get_AppliedConditions(creature, "Drained").forEach(gain => {gain.value -= 1});
            //Reset all "once per day" activity cooldowns.
            this.activitiesService.rest(creature, characterService);
            //Reset all conditions that are "until the next time you make your daily preparations";
            this.conditionsService.rest(creature, characterService);
            //Reset all conditions that are "until the next time you make your daily preparations";
            if (creature.type != "Familiar") {
                itemsService.rest(creature, characterService);
            }
            //For the Character, reset all "once per day" spells, and regenerate spell slots and bonded item charges.
            if (creature.type == "Character") {
                let character = creature as Character;
                //Reset all "once per day" spell cooldowns and re-prepare spells.
                this.spellsService.rest(character, characterService);
                //Regenerate spell slots.
                character.class.spellCasting.forEach(casting => {
                    casting.spellSlotsUsed = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                });
                //Regenerate bonded item charges.
                character.class.spellCasting.filter(casting => casting.castingType == "Prepared" && casting.className == "Wizard").forEach(casting => {
                    if (character.get_FeatsTaken(1, character.level, "Universalist").length) {
                        casting.bondedItemCharges = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    } else {
                        casting.bondedItemCharges = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                });
            }
        });
        
        characterService.set_Changed();
    }

    tick(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, turns: number = 10) {
        characterService.get_Creatures().forEach(creature => {
            this.conditionsService.tick_Conditions(creature, turns, this.yourTurn);
            this.activitiesService.tick_Activities(creature, characterService, timeService, itemsService, spellsService, turns)
            if (turns >= 1000 && characterService.get_Health(creature).damage == 0) {
                characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => characterService.remove_Condition(creature, gain));
            }
            //Tick down and remove any oils whose effect is running out.
            if (creature.type != "Familiar") {
                itemsService.tick_Items(creature, characterService, turns);
            }
            if (creature.type == "Character") {
                this.spellsService.tick_Spells(creature, characterService, itemsService, this, turns);
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
