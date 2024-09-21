import { Injectable } from '@angular/core';
import { of, switchMap, zip, map, take, withLatestFrom, Observable, distinctUntilChanged } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { AbsoluteEffect } from 'src/app/classes/effects/effect';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { OnceEffectsService } from 'src/libs/shared/services/once-effects/once-effects.service';
import { SpellCastingPrerequisitesService } from 'src/libs/shared/services/spell-casting-prerequisites/spell-casting-prerequisites.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { ActivitiesTimeService } from '../activities-time/activities-time.service';
import { ConditionsTimeService } from '../conditions-time/conditions-time.service';
import { CustomEffectsTimeService } from '../custom-effects-time/custom-effects-time.service';
import { ItemsTimeService } from '../items-time/items-time.service';
import { SpellsTimeService } from '../spells-time/spells-time.service';
import { TurnService } from '../turn/turn.service';
import { emptySafeCombineLatest, emptySafeZip } from 'src/libs/shared/util/observable-utils';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { filterConditions } from 'src/libs/shared/services/creature-conditions/condition-filter-utils';
import { AppliedCreatureConditionsService } from 'src/libs/shared/services/creature-conditions/applied-creature-conditions.service';
import { filterDefinedArrayMembers$ } from 'src/libs/shared/util/array-utils';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';

@Injectable({
    providedIn: 'root',
})
export class TimeService {

    constructor(
        private readonly _activitiesTimeService: ActivitiesTimeService,
        private readonly _customEffectsTimeService: CustomEffectsTimeService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _toastService: ToastService,
        private readonly _abilityValueService: AbilityValuesService,
        private readonly _healthService: HealthService,
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _conditionsTimeService: ConditionsTimeService,
        private readonly _spellsTimeService: SpellsTimeService,
        private readonly _itemsTimeService: ItemsTimeService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _messageSendingService: MessageSendingService,
        private readonly _onceEffectsService: OnceEffectsService,
        private readonly _spellCastingPrerequisitesService: SpellCastingPrerequisitesService,
    ) { }

    public startTurn(): void {
        //Apply Fast Healing.
        let fastHealing = 0;

        const character = CreatureService.character;

        (
            character.settings.manualMode
                ? of(new Array<Creature>())
                : this._creatureAvailabilityService.allAvailableCreatures$()
        )
            .pipe(
                switchMap(creatureList => emptySafeZip(
                    creatureList
                        .map(creature => zip([
                            this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Fast Healing'),
                            this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Fast Healing'),
                            this._creatureEffectsService.effectsOnThis$(creature, 'Time Stop'),
                            this._healthService.currentHP$(creature),
                        ])
                            .pipe(
                                map(([fastHealingAbsolutes, fastHealingRelatives, timeStopEffects, currentHP]) =>
                                    ({ creature, fastHealingAbsolutes, fastHealingRelatives, timeStopEffects, currentHP }),
                                ),
                            ),
                        ),
                )),
                take(1),
            )
            .subscribe(creatureParameterList => {
                creatureParameterList
                    .forEach(({ creature, fastHealingAbsolutes, fastHealingRelatives, timeStopEffects, currentHP }) => {
                        fastHealingAbsolutes.forEach(effect => {
                            fastHealing = effect.setValueNumerical;
                        });
                        fastHealingRelatives.forEach(effect => {
                            fastHealing += effect.valueNumerical;
                        });

                        if (!timeStopEffects.length) {
                            if (fastHealing && currentHP.result > 0) {
                                this._healthService.heal(creature, fastHealing);

                                this._toastService.show(
                                    `${ creature.isCharacter()
                                        ? 'You'
                                        : (creature.name ? creature.name : `Your ${ creature.type.toLowerCase() }`)
                                    } gained ${ (fastHealing).toString() } HP from fast healing.`,
                                );
                            }
                        }
                    });

                this.tick(TimePeriods.HalfTurn);

                //If the character is in a party and sendTurnStartMessage is set, send a turn end event to all your party members.
                if (character.partyName && character.settings.sendTurnStartMessage && !character.settings.sendTurnEndMessage) {
                    this._messageSendingService.sendTurnChangeToPlayers();
                }
            });
    }

    public endTurn(): void {
        this.tick(TimePeriods.HalfTurn);

        //If the character is in a party and sendTurnEndMessage is set, send a turn end event to all your party members.
        const character = CreatureService.character;

        if (character.partyName && character.settings.sendTurnStartMessage && character.settings.sendTurnEndMessage) {
            this._messageSendingService.sendTurnChangeToPlayers();
        }
    }

    public rest(): void {
        const charLevel: number = CreatureService.character.level;

        this.tick(TimePeriods.EightHours);

        this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                switchMap(creatures =>
                    emptySafeZip(
                        creatures
                            .map(creature => zip([
                                of(creature),
                                this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Resting HP Gain'),
                                this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Resting HP Gain'),
                                this._creatureEffectsService.absoluteEffectsOnThis$(creature, 'Resting HP Multiplier'),
                                this._creatureEffectsService.relativeEffectsOnThis$(creature, 'Resting HP Multiplier'),
                                this._abilityValueService.mod$('Constitution', creature),
                            ])),
                    ),
                ),
                withLatestFrom(zip([
                    this._characterFeatsService.characterHasFeatAtLevel$('Superior Bond'),
                    this._characterFeatsService.characterHasFeatAtLevel$('Universalist Wizard'),
                    this._spellCastingPrerequisitesService.maxFocusPoints$,
                ])),
                take(1),
            )
            .subscribe(([creatureSets, [hasSuperiorBond, hasUniversalistWizard, maxFocusPoints]]) => {
                creatureSets.forEach(
                    ([
                        creature,
                        gainAbsolutes,
                        gainRelatives,
                        multiplierAbsolutes,
                        multiplierRelatives,
                        constitutionModifier,
                    ]) => {
                        let con = 1;

                        con = Math.max(
                            constitutionModifier.result,
                            1,
                        );

                        let heal: number = con * charLevel;

                        gainAbsolutes.forEach(effect => {
                            heal = effect.setValueNumerical;
                        });
                        gainRelatives.forEach(effect => {
                            heal += effect.valueNumerical;
                        });

                        let multiplier = 1;

                        multiplierAbsolutes.forEach(effect => {
                            multiplier = effect.setValueNumerical;
                        });
                        multiplierRelatives.forEach(effect => {
                            multiplier += effect.valueNumerical;
                        });
                        multiplier = Math.max(1, multiplier);
                        this._healthService.heal(creature, heal * multiplier, true, true);
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

                        // For the Character, reset all "once per day" spells,
                        // and regenerate spell slots, prepared formulas and bonded item charges.
                        if (creature.isCharacter()) {
                            const character = creature as Character;

                            //Reset all "once per day" spell cooldowns and re-prepare spells.
                            this._spellsTimeService.restSpells();
                            //Regenerate spell slots.
                            character.class.spellCasting.forEach(casting => {
                                casting.spellSlotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            });

                            //Refocus and reset all "until you refocus" spell cooldowns.
                            this.refocus(maxFocusPoints, false, false);

                            //Regenerate Snare Specialist formulas.
                            character.class.formulaBook.filter(learned => learned.snareSpecialistPrepared).forEach(learned => {
                                learned.snareSpecialistAvailable = learned.snareSpecialistPrepared;
                            });
                            //Regenerate bonded item charges.
                            character.class.spellCasting
                                .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                                .forEach(casting => {
                                    const superiorBond = hasSuperiorBond ? 1 : 0;

                                    if (hasUniversalistWizard) {
                                        casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                                    } else {
                                        casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                    }
                                });
                        }
                    },
                );
            });
    }

    public refocus(
        recoverPoints = 1,
        reload = true,
        tick = true,
    ): void {
        if (tick) {
            this.tick(TimePeriods.TenMinutes);
        }

        const character = CreatureService.character;
        const maximumFocusPoints = 3;

        this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                take(1),
            )
            .subscribe(creatures => creatures
                .forEach(creature => {
                    //Reset all "until you refocus" activity cooldowns.
                    this._activitiesTimeService.refocusActivities(creature);
                    //Reset all conditions that are "until you refocus".
                    this._conditionsTimeService.refocusConditions(creature);
                    //Remove all items that expire when you refocus.
                    this._itemsTimeService.refocusItems(creature);
                }),
            );

        //Reset all "once per day" spell cooldowns and re-prepare spells.
        this._spellsTimeService.refocusSpells();

        const focusPoints = character.class.focusPoints;
        const focusPointsLast = character.class.focusPointsLast;
        let finalRecoverPoints = recoverPoints;

        (
            (finalRecoverPoints < maximumFocusPoints)
                // Several feats recover more focus points if you spent at least that amount since the last time refocusing.
                // Those feats all have an effect setting "Refocus Bonus Points" to the amount you get.
                ? this._creatureEffectsService.absoluteEffectsOnThis$(character, 'Refocus Bonus Points')
                : of(new Array<AbsoluteEffect>())
        )
            .pipe(
                take(1),
            )
            .subscribe(refocusEffects => {
                refocusEffects.forEach(effect => {
                    const points = effect.setValueNumerical;

                    if (focusPointsLast - focusPoints >= points) {
                        finalRecoverPoints = Math.max(finalRecoverPoints, points);
                    }
                });

                //Regenerate Focus Points by calling a onceEffect (so we don't have the code twice).
                this._onceEffectsService.processOnceEffect(
                    character,
                    EffectGain.from({ affected: 'Focus Points', value: `+${ finalRecoverPoints }` }),
                );

                character.class.focusPointsLast = character.class.focusPoints;
            });
    }

    public tick(
        turns = 10,
    ): void {
        zip([
            this._creatureAvailabilityService.allAvailableCreatures$()
                .pipe(
                    // For each creature, also collect all applied conditions that stop time.
                    switchMap(creatures =>
                        emptySafeCombineLatest(
                            creatures.map(creature =>
                                this._collectTimeStoppingConditions$(creature)
                                    .pipe(
                                        map(timeStopConditions => ({ creature, timeStopConditions })),
                                    ),
                            ),
                        )),
                ),
            TurnService.yourTurn$,
        ])
            .pipe(
                take(1),
            )
            .subscribe(([creatureSets, yourTurn]) => {
                creatureSets.forEach(({ creature, timeStopConditions }) => {
                    const timeStopDurations = timeStopConditions.map(gain => gain.duration);

                    //If any conditions are currently stopping time, process these first before continuing with the rest.
                    //If any time stopping condition is permanent, no time passes at all.
                    if (timeStopDurations.includes(-1)) {
                        return;
                    }

                    let highestTimeStopDuration: number = Math.max(0, ...timeStopDurations);

                    //Round the duration up to half turns, but no longer than the entered amount of turns.
                    highestTimeStopDuration =
                        Math.min(Math.ceil(highestTimeStopDuration / TimePeriods.HalfTurn) * TimePeriods.HalfTurn, turns);

                    if (highestTimeStopDuration) {
                        this._conditionsTimeService.tickConditions(
                            timeStopConditions,
                            { creature, turns: highestTimeStopDuration, yourTurn },
                        );
                    }

                    const creatureTurns = turns - highestTimeStopDuration;

                    if (creatureTurns > 0) {
                        // Tick activities before conditions because activities can end conditions,
                        // which might go wrong if the condition has already ended (particularly where cooldowns are concerned).
                        this._activitiesTimeService.tickActivities(creature, creatureTurns);

                        if (creature.conditions.length) {
                            this._conditionsTimeService.tickConditions(
                                creature.conditions,
                                { creature, turns: creatureTurns, yourTurn },
                            );
                        }

                        this._customEffectsTimeService.tickCustomEffects(creature, creatureTurns);
                        this._itemsTimeService.tickItems(creature, creatureTurns);

                        if (creature.isCharacter()) {
                            this._spellsTimeService.tickSpells(creatureTurns);
                        }

                        // If you are at full health and take a break for at least 10 minutes, you lose the wounded condition.
                        if (creatureTurns >= TimePeriods.TenMinutes && creature.health.damage === 0) {
                            this._creatureConditionRemovalService.removeConditionGains(
                                filterConditions(creature.conditions, { name: 'Wounded' }),
                                creature,
                            );
                        }
                    }
                });

                TurnService.setYourTurn((yourTurn + turns) % TimePeriods.Turn);
            });
    }

    private _collectTimeStoppingConditions$(creature: Creature): Observable<Array<ConditionGain>> {
        return this._appliedCreatureConditionsService.appliedCreatureConditions$(creature)
            .pipe(
                switchMap(conditions =>
                    emptySafeCombineLatest(
                        conditions
                            .map(({ condition, gain }) =>
                                condition.isStoppingTime$(gain)
                                    .pipe(
                                        distinctUntilChanged(),
                                        map(isStoppingTime =>
                                            isStoppingTime ? gain : undefined,
                                        ),
                                    ),
                            ),
                    ),
                ),
                filterDefinedArrayMembers$(),
            );
    }

}
