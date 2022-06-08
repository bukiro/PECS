/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { ConditionsService } from 'src/app/services/conditions.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { SpellsService } from 'src/app/services/spells.service';
import { ItemsService } from 'src/app/services/items.service';
import { Character } from 'src/app/classes/Character';
import { EffectGain } from 'src/app/classes/EffectGain';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { ToastService } from 'src/app/services/toast.service';
import { CustomEffectsService } from 'src/app/services/customEffects.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Creature } from 'src/app/classes/Creature';
import { TimePeriods } from '../../libs/shared/definitions/timePeriods';
import { ActivitiesTimeService } from './activities-time.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

@Injectable({
    providedIn: 'root',
})
export class TimeService {

    //yourTurn is 5 if it is your turn or 0 if not.
    private _yourTurn: TimePeriods.NoTurn | TimePeriods.HalfTurn = TimePeriods.NoTurn;

    constructor(
        private readonly _activitiesTimeService: ActivitiesTimeService,
        private readonly _customEffectsService: CustomEffectsService,
        private readonly _effectsService: EffectsService,
        private readonly _toastService: ToastService,
        private readonly _refreshService: RefreshService,
    ) { }

    public getYourTurn(): number {
        return this._yourTurn;
    }

    public setYourTurn(yourTurn: number): void {
        //Only used when loading a character
        this._yourTurn = yourTurn;
    }

    public startTurn(
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
        effectsService: EffectsService,
    ): void {
        //Apply Fast Healing.
        let fastHealing = 0;

        if (!characterService.character.settings.manualMode) {
            characterService.allAvailableCreatures().forEach(creature => {

                effectsService.absoluteEffectsOnThis(creature, 'Fast Healing').forEach((effect: Effect) => {
                    fastHealing = parseInt(effect.setValue, 10);
                });
                effectsService.relativeEffectsOnThis(creature, 'Fast Healing').forEach((effect: Effect) => {
                    fastHealing += parseInt(effect.value, 10);
                });

                if (!this._effectsService.effectsOnThis(creature, 'Time Stop').length) {
                    if (fastHealing && creature.health.currentHP(creature, characterService, effectsService).result > 0) {
                        this._refreshService.prepareDetailToChange(creature.type, 'health');
                        creature.health.heal(creature, characterService, effectsService, fastHealing);
                        this._toastService.show(
                            `${ creature instanceof Character
                                ? 'You'
                                : (creature.name ? creature.name : `Your ${ creature.type.toLowerCase() }`)
                            } gained ${ (fastHealing).toString() } HP from fast healing.`,
                        );
                    }
                }

            });
        }

        this.tick(characterService, conditionsService, itemsService, spellsService, TimePeriods.HalfTurn);

        //If the character is in a party and sendTurnStartMessage is set, send a turn end event to all your party members.
        const character = characterService.character;

        if (character.partyName && character.settings.sendTurnStartMessage && !character.settings.sendTurnEndMessage) {
            characterService.sendTurnChangeToPlayers();
        }

        this._refreshService.processPreparedChanges();
    }

    public endTurn(
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
    ): void {
        this.tick(characterService, conditionsService, itemsService, spellsService, TimePeriods.HalfTurn);

        //If the character is in a party and sendTurnEndMessage is set, send a turn end event to all your party members.
        const character = characterService.character;

        if (character.partyName && character.settings.sendTurnStartMessage && character.settings.sendTurnEndMessage) {
            characterService.sendTurnChangeToPlayers();
        }
    }

    public rest(
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
    ): void {
        const charLevel: number = characterService.character.level;

        this.tick(characterService, conditionsService, itemsService, spellsService, TimePeriods.EightHours, false);
        characterService.allAvailableCreatures().forEach(creature => {
            this._refreshService.prepareDetailToChange(creature.type, 'health');
            this._refreshService.prepareDetailToChange(creature.type, 'effects');

            let con = 1;

            con = Math.max(
                characterService.abilitiesService
                    .abilities('Constitution')[0]
                    .mod(creature, characterService, characterService.effectsService).result,
                1,
            );

            let heal: number = con * charLevel;

            this._effectsService.absoluteEffectsOnThis(creature, 'Resting HP Gain').forEach(effect => {
                heal = parseInt(effect.setValue, 10);
            });
            this._effectsService.relativeEffectsOnThis(creature, 'Resting HP Gain').forEach(effect => {
                heal += parseInt(effect.value, 10);
            });

            let multiplier = 1;

            this._effectsService.absoluteEffectsOnThis(creature, 'Resting HP Multiplier').forEach(effect => {
                multiplier = parseInt(effect.setValue, 10);
            });
            this._effectsService.relativeEffectsOnThis(creature, 'Resting HP Multiplier').forEach(effect => {
                multiplier += parseInt(effect.value, 10);
            });
            multiplier = Math.max(1, multiplier);
            creature.health.heal(creature, characterService, characterService.effectsService, heal * multiplier, true, true);
            this._toastService.show(
                `${ creature instanceof Character
                    ? 'You'
                    : (creature.name ? creature.name : `Your ${ creature.type.toLowerCase() }`)
                } gained ${ (heal * multiplier).toString() } HP from resting.`,
            );
            //Reset all "once per day" activity cooldowns.
            this._activitiesTimeService.restActivities(creature, characterService);
            //Reset all conditions that are "until the next time you make your daily preparations".
            conditionsService.restConditions(creature, characterService);
            //Remove all items that expire when you make your daily preparations.
            itemsService.restItems(creature, characterService);

            //For the Character, reset all "once per day" spells, and regenerate spell slots, prepared formulas and bonded item charges.
            if (creature instanceof Character) {
                const character = creature as Character;

                //Reset all "once per day" spell cooldowns and re-prepare spells.
                spellsService.restSpells(character, characterService);
                //Regenerate spell slots.
                character.class.spellCasting.forEach(casting => {
                    casting.spellSlotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                });

                //Refocus and reset all "until you refocus" spell cooldowns.
                const maxFocusPoints = characterService.maxFocusPoints();

                this.refocus(characterService, conditionsService, itemsService, spellsService, maxFocusPoints, false, false);
                //Regenerate Snare Specialist formulas.
                character.class.formulaBook.filter(learned => learned.snareSpecialistPrepared).forEach(learned => {
                    learned.snareSpecialistAvailable = learned.snareSpecialistPrepared;
                });
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
                //Regenerate bonded item charges.
                character.class.spellCasting
                    .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                    .forEach(casting => {
                        const superiorBond = character.hasFeat('Superior Bond', { characterService });

                        if (character.hasFeat('Universalist Wizard', { characterService })) {
                            casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                        } else {
                            casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        }
                    });
            }
        });

        this._refreshService.processPreparedChanges();
    }

    public refocus(
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
        recoverPoints = 1,
        reload = true,
        tick = true,
    ): void {
        if (tick) {
            this.tick(characterService, conditionsService, itemsService, spellsService, TimePeriods.TenMinutes, false);
        }

        const character = characterService.character;
        const maximumFocusPoints = 3;

        characterService.allAvailableCreatures().forEach(creature => {
            //Reset all "until you refocus" activity cooldowns.
            this._activitiesTimeService.refocusActivities(creature, characterService);
            //Reset all conditions that are "until you refocus".
            conditionsService.refocusConditions(creature);
            //Remove all items that expire when you refocus.
            itemsService.refocusItems(creature, characterService);
        });

        //Reset all "once per day" spell cooldowns and re-prepare spells.
        spellsService.refocusSpells(character, characterService);

        const focusPoints = character.class.focusPoints;
        const focusPointsLast = character.class.focusPointsLast;
        let finalRecoverPoints = recoverPoints;

        if (finalRecoverPoints < maximumFocusPoints) {
            // Several feats recover more focus points if you spent at least that amount since the last time refocusing.
            // Those feats all have an effect setting "Refocus Bonus Points" to the amount you get.
            characterService.effectsService.absoluteEffectsOnThis(character, 'Refocus Bonus Points').forEach(effect => {
                const points = parseInt(effect.setValue, 10);

                if (focusPointsLast - focusPoints >= points) {
                    finalRecoverPoints = Math.max(finalRecoverPoints, points);
                }
            });
        }

        //Regenerate Focus Points by calling a onceEffect (so we don't have the code twice).
        characterService.processOnceEffect(
            character,
            Object.assign(new EffectGain(), { affected: 'Focus Points', value: `+${ finalRecoverPoints }` }),
        );

        character.class.focusPointsLast = character.class.focusPoints;

        if (reload) {
            this._refreshService.processPreparedChanges();
        }
    }

    public tick(
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
        turns = 10,
        reload = true,
    ): void {
        characterService.allAvailableCreatures().forEach(creature => {
            //If any conditions are currently stopping time, process these first before continuing with the rest.
            const timeStopDurations = creature.conditions
                .filter(gain => gain.apply && conditionsService.conditionFromName(gain.name).isStoppingTime(gain))
                .map(gain => gain.duration);

            //If any time stopping condition is permanent, no time passes at all.
            if (!timeStopDurations.includes(-1)) {
                let timeStopDuration: number = Math.max(0, ...timeStopDurations);

                //Round the duration up to half turns, but no longer than the entered amount of turns.
                timeStopDuration = Math.min(Math.ceil(timeStopDuration / TimePeriods.HalfTurn) * TimePeriods.HalfTurn, turns);

                if (timeStopDuration) {
                    if (creature.conditions.filter(gain => gain.nextStage > 0)) {
                        this._refreshService.prepareDetailToChange(creature.type, 'time');
                        this._refreshService.prepareDetailToChange(creature.type, 'health');
                    }

                    conditionsService.tickConditions(creature, timeStopDuration, this._yourTurn, characterService, itemsService);
                    this._refreshService.prepareDetailToChange(creature.type, 'effects');
                }

                const creatureTurns = turns - timeStopDuration;

                if (creatureTurns > 0) {
                    // Tick activities before conditions because activities can end conditions,
                    // which might go wrong if the condition has already ended (particularly where cooldowns are concerned).
                    this._activitiesTimeService.tickActivities(
                        creature,
                        characterService,
                        conditionsService,
                        itemsService,
                        spellsService,
                        creatureTurns,
                    );

                    if (creature.conditions.length) {
                        if (creature.conditions.filter(gain => gain.nextStage > 0)) {
                            this._refreshService.prepareDetailToChange(creature.type, 'time');
                            this._refreshService.prepareDetailToChange(creature.type, 'health');
                        }

                        conditionsService.tickConditions(creature, creatureTurns, this._yourTurn, characterService, itemsService);
                        this._refreshService.prepareDetailToChange(creature.type, 'effects');
                    }

                    this._customEffectsService.tickCustomEffects(creature, creatureTurns);
                    itemsService.tickItems((creature as AnimalCompanion | Character), characterService, creatureTurns);

                    if (creature instanceof Character) {
                        spellsService.tickSpells((creature as Character), characterService, itemsService, conditionsService, creatureTurns);
                    }

                    //If you are at full health and rest for 10 minutes, you lose the wounded condition.
                    if (creatureTurns >= TimePeriods.TenMinutes && creature.health.damage === 0) {
                        characterService
                            .currentCreatureConditions(creature, 'Wounded')
                            .forEach(gain => characterService.removeCondition(creature, gain, false));
                    }
                }
            }
        });
        this._yourTurn = (this._yourTurn + turns) % TimePeriods.Turn;

        if (reload) {
            this._refreshService.processPreparedChanges();
        }
    }

    public durationDescription(duration: number, includeTurnState = true, inASentence = false, short = false): string {
        if (duration === TimePeriods.UntilRefocus) {
            return inASentence
                ? 'until you refocus'
                : 'Until you refocus';
        } else if (duration === TimePeriods.UntilRest) {
            return inASentence
                ? 'until the next time you make your daily preparations'
                : 'Until the next time you make your daily preparations';
        } else if (duration === TimePeriods.Permanent) {
            return inASentence
                ? 'permanently'
                : 'Permanent';
        } else if (duration === TimePeriods.UntilOtherCharactersTurn) {
            return inASentence
                ? 'until another character\'s turn'
                : 'Ends on another character\'s turn';
        } else if ([TimePeriods.UntilResolved, TimePeriods.UntilResolvedAndOtherCharactersTurn].includes(duration)) {
            return inASentence
                ? 'until resolved'
                : 'Until resolved';
        } else {
            let returnString = '';
            let workingDuration = duration;
            //Cut off anything that isn't divisible by 5
            const remainder: number = workingDuration % TimePeriods.HalfTurn;

            workingDuration -= remainder;

            if (workingDuration === TimePeriods.HalfTurn) {
                if (this.getYourTurn() === TimePeriods.HalfTurn) {
                    return inASentence
                        ? 'for rest of turn'
                        : 'Rest of turn';
                }

                if (this.getYourTurn() === TimePeriods.NoTurn) {
                    return inASentence
                        ? 'until start of next turn'
                        : 'To start of next turn';
                }
            }

            returnString += inASentence ? 'for ' : '';

            if (workingDuration >= TimePeriods.Day) {
                returnString += Math.floor(workingDuration / TimePeriods.Day) + (short ? 'd' : ' day');

                if (!short && workingDuration / TimePeriods.Day > 1) { returnString += 's'; }

                workingDuration %= TimePeriods.Day;
            }

            if (workingDuration >= TimePeriods.Hour) {
                returnString += ` ${ Math.floor(workingDuration / TimePeriods.Hour) }${ short ? 'h' : ' hour' }`;

                if (!short && workingDuration / TimePeriods.Hour > 1) { returnString += 's'; }

                workingDuration %= TimePeriods.Hour;
            }

            if (workingDuration >= TimePeriods.Minute) {
                returnString += ` ${ Math.floor(workingDuration / TimePeriods.Minute) }${ short ? 'm' : ' minute' }`;

                if (!short && workingDuration / TimePeriods.Minute > 1) { returnString += 's'; }

                workingDuration %= TimePeriods.Minute;
            }

            if (workingDuration >= TimePeriods.Turn) {
                returnString += ` ${ Math.floor(workingDuration / TimePeriods.Turn) }${ short ? 't' : ' turn' }`;

                if (!short && workingDuration / TimePeriods.Turn > 1) { returnString += 's'; }

                workingDuration %= TimePeriods.Turn;
            }

            if (includeTurnState && workingDuration === TimePeriods.HalfTurn && this.getYourTurn() === TimePeriods.HalfTurn) {
                returnString += ' to end of turn';
            }

            if (includeTurnState && workingDuration === TimePeriods.HalfTurn && this.getYourTurn() === TimePeriods.NoTurn) {
                returnString += ' to start of turn';
            }

            if (!returnString || returnString === 'for ') {
                returnString = inASentence
                    ? 'for 0 turns'
                    : '0 turns';
            }

            if (remainder === 1) {
                returnString += ', then until resolved';
            }

            return returnString.trim();
        }
    }

    public waitingDescription(
        duration: number,
        services: { characterService: CharacterService; conditionsService: ConditionsService },
        options: { includeResting: boolean },
    ): string {
        let result = '';
        const characterService = services.characterService;
        const conditionsService = services.conditionsService;
        const effectsService = this._effectsService;

        const AfflictionOnsetsWithinDuration = (creature: Creature): boolean =>
            characterService
                .currentCreatureConditions(creature, '', '', true)
                .some(gain =>
                    (
                        !conditionsService.conditionFromName(gain.name).automaticStages &&
                        !gain.paused &&
                        gain.nextStage < duration &&
                        gain.nextStage > 0
                    ) ||
                    gain.nextStage === -1 ||
                    gain.durationIsInstant);

        const TimeStopConditionsActive = (creature: Creature): boolean =>
            characterService
                .currentCreatureConditions(creature, '', '', true)
                .some(gain =>
                    conditionsService
                        .conditionFromName(gain.name)
                        .stopTimeChoiceFilter
                        .some(filter => [gain.choice, 'All'].includes(filter)),
                );
        const MultipleTempHPAvailable = (creature: Creature): boolean =>
            creature.health.temporaryHP.length > 1;
        const RestingBlockingEffectsActive = (creature: Creature): boolean =>
            effectsService.effectsOnThis(creature, 'Resting Blocked').some(effect => !effect.ignored);

        characterService.allAvailableCreatures().forEach(creature => {
            if (AfflictionOnsetsWithinDuration(creature)) {
                result =
                    `One or more conditions${ creature instanceof Character
                        ? ''
                        : ` on your ${ creature.type }`
                    } need to be resolved before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
            }

            if (options.includeResting && TimeStopConditionsActive(creature)) {
                result =
                    `Time is stopped for ${ creature instanceof Character
                        ? ' you'
                        : ` your ${ creature.type }`
                    }, and you cannot ${ options.includeResting ? 'rest' : 'continue' } until this effect has ended.`;
            }

            if (MultipleTempHPAvailable(creature)) {
                result =
                    `You need to select one set of temporary Hit Points${ creature instanceof Character
                        ? ''
                        : ` on your ${ creature.type }`
                    } before you can ${ options.includeResting ? 'rest' : 'continue' }.`;
            }

            if (options.includeResting && RestingBlockingEffectsActive(creature)) {
                result =
                    `An effect${ creature instanceof Character
                        ? ''
                        : ` on your ${ creature.type }`
                    } is keeping you from resting.`;
            }
        });

        return result;
    }

}
