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
        this.tick(characterService, timeService, itemsService, spellsService, 48000, false);
        characterService.get_Creatures().forEach(creature => {
            characterService.set_ToChange(creature.type, "health");
            let con = 1;
            if (creature.type != "Familiar") {
                con = Math.max(characterService.abilitiesService.get_Abilities("Constitution")[0].mod(creature, characterService, characterService.effectsService).result, 1);
            }
            let heal: number = con * charLevel;
            this.effectsService.get_RelativesOnThis(creature, "Resting HP Gain").forEach(effect => {
                heal += parseInt(effect.value);
            })
            characterService.get_Health(creature).heal(creature, characterService, characterService.effectsService, heal, true, true);
            
            //Reset all "once per day" activity cooldowns.
            this.activitiesService.rest(creature, characterService);
            //Reset all conditions that are "until the next time you make your daily preparations";
            this.conditionsService.rest(creature, characterService);
            //Reset all conditions that are "until the next time you make your daily preparations";
            if (creature.type != "Familiar") {
                itemsService.rest(creature, characterService);
            }
            //For the Character, reset all "once per day" spells, and regenerate spell slots, prepared formulas and bonded item charges.
            if (creature.type == "Character") {
                let character = creature as Character;
                //Reset all "once per day" spell cooldowns and re-prepare spells.
                this.spellsService.rest(character, characterService);
                //Regenerate spell slots.
                character.class.spellCasting.forEach(casting => {
                    casting.spellSlotsUsed = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                });
                //Regenerate Snare Specialist formulas
                character.class.formulaBook.filter(learned => learned.snareSpecialistPrepared).forEach(learned => {
                    learned.snareSpecialistAvailable = learned.snareSpecialistPrepared;
                });
                characterService.set_ToChange("Character", "inventory");
                //Regenerate bonded item charges.
                character.class.spellCasting.filter(casting => casting.castingType == "Prepared" && casting.className == "Wizard").forEach(casting => {
                    let superiorBond = character.get_FeatsTaken(1, character.level, "Superior Bond").length;
                    if (character.get_FeatsTaken(1, character.level, "Universalist Wizard").length) {
                        casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    } else {
                        casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                });
            }
        });
        
        characterService.process_ToChange();
    }

    tick(characterService: CharacterService, timeService: TimeService, itemsService: ItemsService, spellsService: SpellsService, turns: number = 10, reload: boolean = true) {
        characterService.get_Creatures().forEach(creature => {
            if (creature.conditions.length) {
                if (creature.conditions.filter(gain => gain.nextStage > 0)) {
                    characterService.set_ToChange(creature.type, "time");
                    characterService.set_ToChange(creature.type, "health");
                }
                this.conditionsService.tick_Conditions(creature, turns, this.yourTurn);
                characterService.set_ToChange(creature.type, "effects")
            }
            this.effectsService.tick_CustomEffects(creature, characterService, turns);
            this.activitiesService.tick_Activities(creature, characterService, timeService, itemsService, spellsService, turns)
            if (creature.type != "Familiar") {
                itemsService.tick_Items(creature, characterService, turns);
            }
            if (creature.type == "Character") {
                this.spellsService.tick_Spells(creature, characterService, itemsService, this, turns);
            }
            //If you are at full health and rest for 10 minutes, you lose the wounded condition.
            if (turns >= 1000 && characterService.get_Health(creature).damage == 0) {
                characterService.get_AppliedConditions(creature, "Wounded").forEach(gain => characterService.remove_Condition(creature, gain, false));
            }
        })
        this.yourTurn = (this.yourTurn + turns) % 10;
        if (reload) {
            characterService.process_ToChange();
        }
    }

    get_Duration(duration: number, includeTurnState: boolean = true, inASentence: boolean = false) {
        if (duration == -2) {
            return inASentence ? "until the next time you make your daily preparations" : "Until the next time you make your daily preparations";
        } else if (duration == -1) {
            return inASentence ? "permanently" : "Permanent";
        } else {
            let returnString: string = ""
            if (duration == this.get_YourTurn()) {
                return inASentence ? "for rest of turn" : "Rest of turn";
            } else if (duration == 5) {
                return inASentence ? "until start of next turn" : "To start of next turn";
            }
            returnString += inASentence ? "for " : "";
            if (duration >= 144000) {
                returnString += Math.floor(duration / 144000)+" Day";
                if (duration / 144000 >= 2) { returnString += "s"; }
                duration %= 144000;
            }
            if (duration >= 6000) {
                returnString += " "+Math.floor(duration / 6000)+" Hour";
                if (duration / 6000 >= 2) { returnString += "s"; }
                duration %= 6000;
            }
            if (duration >= 100) {
                returnString += " "+Math.floor(duration / 100)+" Minute";
                if (duration / 100 >= 2) { returnString += "s"; }
                duration %= 100;
            }
            if (duration >= 10) {
                returnString += " "+Math.floor(duration / 10)+" Turn";
                if (duration / 10 >= 2) { returnString += "s"; }
                duration %= 10;
            }
            if (includeTurnState && duration == this.get_YourTurn()) {
                returnString += " to end of turn";
            }
            if (!returnString) {
                returnString = "0 Turns";
            }
            return returnString.trim();
        }
    }

}
