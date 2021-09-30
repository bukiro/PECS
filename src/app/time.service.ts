import { Injectable } from '@angular/core';
import { ConditionsService } from './conditions.service';
import { CharacterService } from './character.service';
import { ActivitiesService } from './activities.service';
import { EffectsService } from './effects.service';
import { Effect } from './Effect';
import { SpellsService } from './spells.service';
import { ItemsService } from './items.service';
import { Character } from './Character';
import { EffectGain } from './EffectGain';
import { AnimalCompanion } from './AnimalCompanion';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root'
})
export class TimeService {

    //yourTurn is 5 if it is your turn or 0 if not.
    private yourTurn: number = 0;

    constructor(
        private activitiesService: ActivitiesService,
        private effectsService: EffectsService,
        private toastService: ToastService
    ) { }

    get_YourTurn() {
        return this.yourTurn;
    }

    set_YourTurn(yourTurn: number) {
        //Only used when loading a character
        this.yourTurn = yourTurn;
    }

    start_Turn(characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, effectsService: EffectsService) {

        //Apply Fast Healing.
        let fastHealing: number = 0;
        if (!characterService.get_Character().settings.manualMode) {
            characterService.get_Creatures().forEach(creature => {
                effectsService.get_AbsolutesOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
                    fastHealing = parseInt(effect.setValue);
                })
                effectsService.get_RelativesOnThis(creature, "Fast Healing").forEach((effect: Effect) => {
                    fastHealing += parseInt(effect.value);
                })
                if (fastHealing && creature.health.currentHP(creature, characterService, effectsService).result > 0) {
                    characterService.set_ToChange(creature.type, "health");
                    creature.health.heal(creature, characterService, effectsService, fastHealing);
                    this.toastService.show((creature.type == "Character" ? "You" : (creature.name ? creature.name : "Your " + creature.type.toLowerCase())) + " gained " + (fastHealing).toString() + " HP from fast healing.", [], characterService)
                }
            })
        }

        this.tick(characterService, conditionsService, itemsService, spellsService, 5);

        //If the character is in a party and sendTurnStartMessage is set, send a turn end event to all your party members.
        let character = characterService.get_Character();
        if (character.partyName && character.settings.sendTurnStartMessage && !character.settings.sendTurnEndMessage) {
            characterService.send_TurnChangeToPlayers();
        }

        characterService.process_ToChange();
    }

    end_Turn(characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService) {
        this.tick(characterService, conditionsService, itemsService, spellsService, 5);

        //If the character is in a party and sendTurnEndMessage is set, send a turn end event to all your party members.
        let character = characterService.get_Character();
        if (character.partyName && character.settings.sendTurnStartMessage && character.settings.sendTurnEndMessage) {
            characterService.send_TurnChangeToPlayers();
        }
    }

    rest(characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService,) {
        let charLevel: number = characterService.get_Character().level;
        this.tick(characterService, conditionsService, itemsService, spellsService, 48000, false);
        characterService.get_Creatures().forEach(creature => {
            characterService.set_ToChange(creature.type, "health");
            characterService.set_ToChange(creature.type, "effects");
            let con = 1;
            if (creature.type != "Familiar") {
                con = Math.max(characterService.abilitiesService.get_Abilities("Constitution")[0].mod((creature as AnimalCompanion | Character), characterService, characterService.effectsService).result, 1);
            }
            let heal: number = con * charLevel;
            this.effectsService.get_AbsolutesOnThis(creature, "Resting HP Gain").forEach(effect => {
                heal = parseInt(effect.setValue);
            })
            this.effectsService.get_RelativesOnThis(creature, "Resting HP Gain").forEach(effect => {
                heal += parseInt(effect.value);
            })
            let multiplier = 1;
            this.effectsService.get_AbsolutesOnThis(creature, "Resting HP Multiplier").forEach(effect => {
                multiplier = parseInt(effect.setValue);
            })
            this.effectsService.get_RelativesOnThis(creature, "Resting HP Multiplier").forEach(effect => {
                multiplier += parseInt(effect.value);
            })
            multiplier = Math.max(1, multiplier);
            characterService.get_Health(creature).heal(creature, characterService, characterService.effectsService, heal * multiplier, true, true);
            this.toastService.show((creature.type == "Character" ? "You" : (creature.name ? creature.name : "Your " + creature.type.toLowerCase())) + " gained " + (heal * multiplier).toString() + " HP from resting.", [], characterService)
            //Reset all "once per day" activity cooldowns.
            this.activitiesService.rest(creature, characterService);
            //Reset all conditions that are "until the next time you make your daily preparations".
            conditionsService.rest(creature, characterService);
            //Remove all items that expire when you make your daily preparations.
            if (creature.type != "Familiar") {
                itemsService.rest((creature as AnimalCompanion | Character), characterService);
            }
            //For the Character, reset all "once per day" spells, and regenerate spell slots, prepared formulas and bonded item charges.
            if (creature.type == "Character") {
                let character = creature as Character;
                //Reset all "once per day" spell cooldowns and re-prepare spells.
                spellsService.rest(character, characterService);
                //Regenerate spell slots.
                character.class.spellCasting.forEach(casting => {
                    casting.spellSlotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                });
                //Refocus and reset all "until you refocus" spell cooldowns.
                let maxFocusPoints = characterService.get_MaxFocusPoints();
                this.refocus(characterService, conditionsService, itemsService, spellsService, maxFocusPoints, false, false);
                //Regenerate Snare Specialist formulas.
                character.class.formulaBook.filter(learned => learned.snareSpecialistPrepared).forEach(learned => {
                    learned.snareSpecialistAvailable = learned.snareSpecialistPrepared;
                });
                characterService.set_ToChange("Character", "inventory");
                //Regenerate bonded item charges.
                character.class.spellCasting.filter(casting => casting.castingType == "Prepared" && casting.className == "Wizard").forEach(casting => {
                    let superiorBond = characterService.get_CharacterFeatsTaken(1, character.level, "Superior Bond").length;
                    if (characterService.get_CharacterFeatsTaken(1, character.level, "Universalist Wizard").length) {
                        casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    } else {
                        casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    }
                });
            }
        });

        characterService.process_ToChange();
    }

    refocus(characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, recoverPoints: number = 1, reload: boolean = true, tick: boolean = true) {
        if (tick) {
            this.tick(characterService, conditionsService, itemsService, spellsService, 1000, false);
        }
        let character = characterService.get_Character();

        //Reset all "until you refocus" activity cooldowns.
        this.activitiesService.refocus(character, characterService);
        //Reset all conditions that are "until you refocus".
        conditionsService.refocus(character, characterService);
        //Remove all items that expire when you refocus.
        itemsService.refocus(character, characterService);
        //Reset all "once per day" spell cooldowns and re-prepare spells.
        spellsService.refocus(character, characterService);

        let focusPoints = character.class.focusPoints;
        let focusPointsLast = character.class.focusPointsLast;
        if (recoverPoints < 3) {
            //Several feats recover more focus points if you spent at least that amount since the last time refocusing. Those feats all have an effect setting "Refocus Bonus Points" to the amount you get.
            characterService.effectsService.get_AbsolutesOnThis(character, "Refocus Bonus Points").forEach(effect => {
                let points = parseInt(effect.setValue);
                if (focusPointsLast - focusPoints >= points) {
                    recoverPoints = Math.max(recoverPoints, points);
                }
            })
        }

        //Regenerate Focus Points by calling a onceEffect (so we don't have the code twice).
        characterService.process_OnceEffect(character, Object.assign(new EffectGain(), { affected: "Focus Points", value: "+" + recoverPoints }));

        character.class.focusPointsLast = character.class.focusPoints;
        if (reload) {
            characterService.process_ToChange();
        }
    }

    tick(characterService: CharacterService, conditionsService: ConditionsService, itemsService: ItemsService, spellsService: SpellsService, turns: number = 10, reload: boolean = true) {
        characterService.get_Creatures().forEach(creature => {
            //Tick activities before conditions because activities can end conditions, which might go wrong if the condition has already ended (particularly where cooldowns are concerned).
            this.activitiesService.tick_Activities(creature, characterService, conditionsService, itemsService, spellsService, turns)
            if (creature.conditions.length) {
                if (creature.conditions.filter(gain => gain.nextStage > 0)) {
                    characterService.set_ToChange(creature.type, "time");
                    characterService.set_ToChange(creature.type, "health");
                }
                conditionsService.tick_Conditions(creature, turns, this.yourTurn);
                characterService.set_ToChange(creature.type, "effects")
            }
            this.effectsService.tick_CustomEffects(creature, characterService, turns);
            if (creature.type != "Familiar") {
                itemsService.tick_Items((creature as AnimalCompanion | Character), characterService, turns);
            }
            if (creature.type == "Character") {
                spellsService.tick_Spells((creature as Character), characterService, itemsService, conditionsService, turns);
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

    get_Duration(duration: number, includeTurnState: boolean = true, inASentence: boolean = false, short: boolean = false) {
        if (duration == -3) {
            return inASentence ? "until you refocus" : "Until you refocus";
        } else if (duration == -2) {
            return inASentence ? "until the next time you make your daily preparations" : "Until the next time you make your daily preparations";
        } else if (duration == -1) {
            return inASentence ? "permanently" : "Permanent";
        } else if (duration == 2) {
            return inASentence ? "until another character's turn" : "Ends on another character's turn";
        } else if (duration == 1) {
            return inASentence ? "until resolved" : "Until resolved";
        } else {
            let returnString: string = ""
            //Cut off anything that isn't divisible by 5
            let remainder: number = duration % 5;
            duration -= remainder;
            if (duration == 5) {
                if (this.get_YourTurn() == 5) {
                    return inASentence ? "for rest of turn" : "Rest of turn";
                }
                if (this.get_YourTurn() == 0) {
                    return inASentence ? "until start of next turn" : "To start of next turn";
                }
            }
            returnString += inASentence ? "for " : "";
            if (duration >= 144000) {
                returnString += Math.floor(duration / 144000) + (short ? "d" : " day");
                if (!short && duration / 144000 >= 2) { returnString += "s"; }
                duration %= 144000;
            }
            if (duration >= 6000) {
                returnString += " " + Math.floor(duration / 6000) + (short ? "h" : " hour");
                if (!short && duration / 6000 >= 2) { returnString += "s"; }
                duration %= 6000;
            }
            if (duration >= 100) {
                returnString += " " + Math.floor(duration / 100) + (short ? "m" : " minute");
                if (!short && duration / 100 >= 2) { returnString += "s"; }
                duration %= 100;
            }
            if (duration >= 10) {
                returnString += " " + Math.floor(duration / 10) + (short ? "t" : " turn");
                if (!short && duration / 10 >= 2) { returnString += "s"; }
                duration %= 10;
            }
            if (includeTurnState && duration == 5 && this.get_YourTurn() == 5) {
                returnString += " to end of turn";
            }
            if (includeTurnState && duration == 5 && this.get_YourTurn() == 0) {
                returnString += " to start of turn";
            }
            if (!returnString || returnString == "for ") {
                returnString = inASentence ? "for 0 turns" : "0 turns";
            }
            if (remainder == 1) {
                returnString += ", then until resolved";
            }
            return returnString.trim();
        }
    }

}
