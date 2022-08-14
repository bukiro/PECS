import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Effect } from 'src/app/classes/Effect';
import { Character } from 'src/app/classes/Character';
import { EffectGain } from 'src/app/classes/EffectGain';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { CustomEffectsTimeService } from 'src/libs/time/services/custom-effects-time/custom-effects-time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { ActivitiesTimeService } from 'src/libs/time/services/activities-time/activities-time.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { ConditionsDataService } from '../../../../app/core/services/data/conditions-data.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionsTimeService } from 'src/libs/time/services/conditions-time/conditions-time.service';
import { SpellsTimeService } from 'src/libs/time/services/spells-time/spells-time.service';
import { AbilitiesDataService } from '../../../../app/core/services/data/abilities-data.service';
import { ItemsTimeService } from '../items-time/items-time.service';

@Injectable({
    providedIn: 'root',
})
export class TimeService {

    //yourTurn is 5 if it is your turn or 0 if not.
    private _yourTurn: TimePeriods.NoTurn | TimePeriods.HalfTurn = TimePeriods.NoTurn;

    constructor(
        private readonly _activitiesTimeService: ActivitiesTimeService,
        private readonly _customEffectsTimeService: CustomEffectsTimeService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _toastService: ToastService,
        private readonly _refreshService: RefreshService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _abilityValueService: AbilityValuesService,
        private readonly _healthService: HealthService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _conditionsTimeService: ConditionsTimeService,
        private readonly _spellsTimeService: SpellsTimeService,
        private readonly _characterService: CharacterService,
        private readonly _itemsTimeService: ItemsTimeService,
    ) { }

    public get yourTurn(): TimePeriods.NoTurn | TimePeriods.HalfTurn {
        return this._yourTurn;
    }

    public set yourTurn(yourTurn: TimePeriods.NoTurn | TimePeriods.HalfTurn) {
        //Only used when loading a character
        this._yourTurn = yourTurn;
    }

    public startTurn(): void {
        //Apply Fast Healing.
        let fastHealing = 0;

        const character = this._characterService.character;

        if (!character.settings.manualMode) {
            this._characterService.allAvailableCreatures().forEach(creature => {

                this._effectsService.absoluteEffectsOnThis(creature, 'Fast Healing').forEach((effect: Effect) => {
                    fastHealing = parseInt(effect.setValue, 10);
                });
                this._effectsService.relativeEffectsOnThis(creature, 'Fast Healing').forEach((effect: Effect) => {
                    fastHealing += parseInt(effect.value, 10);
                });

                if (!this._effectsService.effectsOnThis(creature, 'Time Stop').length) {
                    if (fastHealing && this._healthService.currentHP(creature.health, creature).result > 0) {
                        this._refreshService.prepareDetailToChange(creature.type, 'health');
                        this._healthService.heal(creature.health, creature, fastHealing);
                        this._toastService.show(
                            `${ creature.isCharacter()
                                ? 'You'
                                : (creature.name ? creature.name : `Your ${ creature.type.toLowerCase() }`)
                            } gained ${ (fastHealing).toString() } HP from fast healing.`,
                        );
                    }
                }

            });
        }

        this.tick(TimePeriods.HalfTurn);

        //If the character is in a party and sendTurnStartMessage is set, send a turn end event to all your party members.
        if (character.partyName && character.settings.sendTurnStartMessage && !character.settings.sendTurnEndMessage) {
            this._characterService.sendTurnChangeToPlayers();
        }

        this._refreshService.processPreparedChanges();
    }

    public endTurn(): void {
        this.tick(TimePeriods.HalfTurn);

        //If the character is in a party and sendTurnEndMessage is set, send a turn end event to all your party members.
        const character = this._characterService.character;

        if (character.partyName && character.settings.sendTurnStartMessage && character.settings.sendTurnEndMessage) {
            this._characterService.sendTurnChangeToPlayers();
        }
    }

    public rest(): void {
        const charLevel: number = this._characterService.character.level;

        this.tick(TimePeriods.EightHours, false);
        this._characterService.allAvailableCreatures().forEach(creature => {
            this._refreshService.prepareDetailToChange(creature.type, 'health');
            this._refreshService.prepareDetailToChange(creature.type, 'effects');

            let con = 1;

            const constitution = this._abilitiesDataService.abilities('Constitution')[0];

            con = Math.max(
                this._abilityValueService.mod(constitution, creature).result,
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
            this._healthService.heal(creature.health, creature, heal * multiplier, true, true);
            this._toastService.show(
                `${ creature.isCharacter()
                    ? 'You'
                    : (creature.name ? creature.name : `Your ${ creature.type.toLowerCase() }`)
                } gained ${ (heal * multiplier).toString() } HP from resting.`,
            );
            //Reset all "once per day" activity cooldowns.
            this._activitiesTimeService.restActivities(creature);
            //Reset all conditions that are "until the next time you make your daily preparations".
            this._conditionsTimeService.restConditions(creature);
            //Remove all items that expire when you make your daily preparations.
            this._itemsTimeService.restItems(creature);

            //For the Character, reset all "once per day" spells, and regenerate spell slots, prepared formulas and bonded item charges.
            if (creature.isCharacter()) {
                const character = creature as Character;

                //Reset all "once per day" spell cooldowns and re-prepare spells.
                this._spellsTimeService.restSpells(character);
                //Regenerate spell slots.
                character.class.spellCasting.forEach(casting => {
                    casting.spellSlotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                });

                //Refocus and reset all "until you refocus" spell cooldowns.
                const maxFocusPoints = this._characterService.maxFocusPoints();

                this.refocus(maxFocusPoints, false, false);
                //Regenerate Snare Specialist formulas.
                character.class.formulaBook.filter(learned => learned.snareSpecialistPrepared).forEach(learned => {
                    learned.snareSpecialistAvailable = learned.snareSpecialistPrepared;
                });
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
                //Regenerate bonded item charges.
                character.class.spellCasting
                    .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                    .forEach(casting => {
                        const superiorBond = this._characterService.characterHasFeat('Superior Bond') ? 1 : 0;

                        if (this._characterService.characterHasFeat('Universalist Wizard')) {
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
        recoverPoints = 1,
        reload = true,
        tick = true,
    ): void {
        if (tick) {
            this.tick(TimePeriods.TenMinutes, false);
        }

        const character = this._characterService.character;
        const maximumFocusPoints = 3;

        this._characterService.allAvailableCreatures().forEach(creature => {
            //Reset all "until you refocus" activity cooldowns.
            this._activitiesTimeService.refocusActivities(creature);
            //Reset all conditions that are "until you refocus".
            this._conditionsTimeService.refocusConditions(creature);
            //Remove all items that expire when you refocus.
            this._itemsTimeService.refocusItems(creature);
        });

        //Reset all "once per day" spell cooldowns and re-prepare spells.
        this._spellsTimeService.refocusSpells(character);

        const focusPoints = character.class.focusPoints;
        const focusPointsLast = character.class.focusPointsLast;
        let finalRecoverPoints = recoverPoints;

        if (finalRecoverPoints < maximumFocusPoints) {
            // Several feats recover more focus points if you spent at least that amount since the last time refocusing.
            // Those feats all have an effect setting "Refocus Bonus Points" to the amount you get.
            this._effectsService.absoluteEffectsOnThis(character, 'Refocus Bonus Points').forEach(effect => {
                const points = parseInt(effect.setValue, 10);

                if (focusPointsLast - focusPoints >= points) {
                    finalRecoverPoints = Math.max(finalRecoverPoints, points);
                }
            });
        }

        //Regenerate Focus Points by calling a onceEffect (so we don't have the code twice).
        this._characterService.processOnceEffect(
            character,
            Object.assign(new EffectGain(), { affected: 'Focus Points', value: `+${ finalRecoverPoints }` }),
        );

        character.class.focusPointsLast = character.class.focusPoints;

        if (reload) {
            this._refreshService.processPreparedChanges();
        }
    }

    public tick(
        turns = 10,
        reload = true,
    ): void {
        this._characterService.allAvailableCreatures().forEach(creature => {
            //If any conditions are currently stopping time, process these first before continuing with the rest.
            const timeStopDurations = creature.conditions
                .filter(gain => gain.apply && this._conditionsDataService.conditionFromName(gain.name).isStoppingTime(gain))
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

                    this._conditionsTimeService.tickConditions(creature, timeStopDuration, this._yourTurn);
                    this._refreshService.prepareDetailToChange(creature.type, 'effects');
                }

                const creatureTurns = turns - timeStopDuration;

                if (creatureTurns > 0) {
                    // Tick activities before conditions because activities can end conditions,
                    // which might go wrong if the condition has already ended (particularly where cooldowns are concerned).
                    this._activitiesTimeService.tickActivities(creature, creatureTurns);

                    if (creature.conditions.length) {
                        if (creature.conditions.filter(gain => gain.nextStage > 0)) {
                            this._refreshService.prepareDetailToChange(creature.type, 'time');
                            this._refreshService.prepareDetailToChange(creature.type, 'health');
                        }

                        this._conditionsTimeService.tickConditions(creature, creatureTurns, this._yourTurn);
                        this._refreshService.prepareDetailToChange(creature.type, 'effects');
                    }

                    this._customEffectsTimeService.tickCustomEffects(creature, creatureTurns);
                    this._itemsTimeService.tickItems((creature as AnimalCompanion | Character), creatureTurns);

                    if (creature.isCharacter()) {
                        this._spellsTimeService.tickSpells(
                            creature,
                            creatureTurns,
                        );
                    }

                    //If you are at full health and rest for 10 minutes, you lose the wounded condition.
                    if (creatureTurns >= TimePeriods.TenMinutes && creature.health.damage === 0) {
                        this._creatureConditionsService
                            .currentCreatureConditions(creature, { name: 'Wounded' })
                            .forEach(gain => this._creatureConditionsService.removeCondition(creature, gain, false));
                    }
                }
            }
        });
        this._yourTurn = (this._yourTurn + turns) % TimePeriods.Turn;

        if (reload) {
            this._refreshService.processPreparedChanges();
        }
    }

}
