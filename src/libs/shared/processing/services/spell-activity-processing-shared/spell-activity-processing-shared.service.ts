/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, tap, map, of, zip } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { SpellTarget } from 'src/app/classes/spells/spell-target';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';

@Injectable({
    providedIn: 'root',
})
export class SpellActivityProcessingSharedService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _messageSendingService: MessageSendingService,
    ) { }

    /**
     * Determine whether a condition gained from an activity or a spell should apply.
     */
    public shouldGainCondition(
        source: Activity | Spell,
        newConditionGain: ConditionGain,
        condition: Condition,
        options: { hasTargetCondition: boolean; isCasterATarget: boolean; isCasterConditionSameAsTargetCondition: boolean },
    ): boolean {
        // Under certain circumstances, don't grant a condition:
        // All these circumstances require that the condition is a caster condition.
        // - If it is a caster condition, there is a target condition, the caster is also a target,
        //   and the caster and the targets get the same condition.
        // - If it is a caster condition, there is a target condition, the caster is also a target,
        //   and the caster condition is purely informational.
        //   This can be overriden by setting alwaysApplyCasterCondition on the condition.
        // - If it is a caster condition, the spell/activity is hostile, hostile caster conditions are disabled,
        //   the caster condition is purely informational, and the spell/activity allows targeting the caster
        //   (which is always the case for hostile spells/activities because they don't have target conditions).
        // - If it is a caster condition, the spell/activity is friendly, friendly caster conditions are disabled,
        //   the caster condition is purely informational, and the spell/activity allows targeting the caster
        //   (otherwise, it must be assumed that the caster condition is necessary).
        return !(
            newConditionGain.targetFilter === 'caster' &&
            (
                (
                    options.hasTargetCondition &&
                    options.isCasterATarget &&
                    (
                        options.isCasterConditionSameAsTargetCondition ||
                        (
                            !condition.alwaysApplyCasterCondition &&
                            !condition.hasEffects() &&
                            !condition.isChangeable()
                        )
                    )
                ) ||
                (
                    (
                        source.isHostile() ?
                            SettingsService.settings.noHostileCasterConditions :
                            SettingsService.settings.noFriendlyCasterConditions
                    ) &&
                    (
                        !condition.hasEffects() &&
                        !condition.isChangeable() &&
                        !source.cannotTargetCaster
                    )
                )
            )
        );
    }

    /**
     * Determine how long the new condition should last.
     * This can change depending on various factors.
     *
     * Returns the names of the conditions that should be removed after they changed the duration.
     */
    public determineGainedConditionDuration$(
        newConditionGain: ConditionGain,
        condition: Condition,
        context: {
            source: Activity | Spell;
            creature: Creature;
            gain: ActivityGain | ItemActivity | SpellGain;
            activityDuration?: number;
        },
        options: { hasTargetCondition: boolean; isCasterATarget: boolean },
    ): Observable<{ conditionsToRemove: Array<string>; newDuration: number }> {
        const conditionsToRemove: Array<string> = [];
        let newDuration = newConditionGain.duration;

        if (
            newConditionGain.targetFilter === 'caster' &&
            options.hasTargetCondition &&
            options.isCasterATarget &&
            !condition.alwaysApplyCasterCondition &&
            !condition.isChangeable() &&
            !condition.hasDurationEffects() &&
            condition.hasInstantEffects()
        ) {
            // If the condition is only granted because it has instant effects,
            // we set the duration to 0, so it can do its thing and then leave.
            newDuration = 0;
        } else {
            //If this is a spell that was cast by an activity, it may have a specified duration. Apply that here.
            if (context.activityDuration) {
                newDuration = context.activityDuration;
            } else if (newConditionGain.durationIsDynamic) {
                //If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
                newDuration =
                    condition.defaultDuration(newConditionGain.choice, newConditionGain.heightened)?.duration || 0;
            }

            return this._determineEffectConditionDuration$(newConditionGain.duration, condition, context)
                .pipe(
                    tap(effectConditionDuration => {
                        conditionsToRemove.push(...effectConditionDuration.conditionsToRemove);
                        newDuration = effectConditionDuration.duration;
                    }),
                    map(() => ({ conditionsToRemove, newDuration })),
                );
        }

        return of({ conditionsToRemove, newDuration });
    }

    public determineGainedConditionChoice$(
        newConditionGain: ConditionGain,
        conditionIndex: number,
        condition: Condition,
        context: { gain: ActivityGain | ItemActivity | SpellGain; creature: Creature },
    ): Observable<string> {
        //Unless the conditionGain has a choice set, try to set it by various factors.
        if (newConditionGain.copyChoiceFrom && context.gain.effectChoices.length) {
            // If the gain has copyChoiceFrom set, use the choice from the designated condition.
            // If there are multiple conditions with the same name, the first is taken.
            return of(
                context.gain.effectChoices.find(choice => choice.condition === newConditionGain.copyChoiceFrom)?.choice
                ?? condition.choice,
            );
        } else if (newConditionGain.choiceBySubType) {
            // If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType,
            // set the choice to that feat's subType as long as it's a valid choice for the condition.
            return this._characterFeatsService
                .characterFeats$(newConditionGain.choiceBySubType, '', { includeCountAs: true, includeSubTypes: true })
                .pipe(
                    map(feats => {
                        const subType =
                            feats
                                .find(feat => feat.superType === newConditionGain.choiceBySubType,
                                );

                        if (subType && condition.choices.map(choice => choice.name).includes(subType.subType)) {
                            return subType.subType;
                        }

                        return newConditionGain.choice;
                    }),
                );
        } else if (
            context.gain instanceof SpellGain &&
            context.gain.overrideChoices.length &&
            context.gain.overrideChoices.some(overrideChoice =>
                overrideChoice.condition === condition.name
                && condition.choices.some(choice => choice.name === overrideChoice.choice),
            )) {

            // If the gain has an override choice prepared that matches this condition, that choice is used.
            // We can compare the condition's choices directly without regenerating its effective choices,
            // since we can assume that the override knows best.
            return of(
                context.gain.overrideChoices
                    .find(overrideChoice =>
                        overrideChoice.condition === condition.name &&
                        condition.choices.some(choice => choice.name === overrideChoice.choice),
                    )?.choice
                ?? newConditionGain.choice,
            );
        } else if (context.gain.effectChoices.length) {
            // If this condition has choices, and the activityGain has choices prepared, apply the choice from the gain.
            // The order of gain.effectChoices should map directly onto the order of the condition gain's conditions,
            // no matter if they have choices in them, so the conditionIndex can be used to look them up.
            // We can compare the condition's choices directly without regenerating its effective choices,
            // since the selection can only have been among the effective choices.
            if (condition.choices.some(choice => choice.name === context.gain.effectChoices[conditionIndex].choice)) {
                return of(context.gain.effectChoices[conditionIndex].choice);
            }
        }

        return of(newConditionGain.choice);
    }

    public determineGainedConditionValue$(
        newConditionGain: ConditionGain,
        condition: Condition,
        context: { creature: Creature },
    ): Observable<{ conditionsToRemove: Array<string>; newValue: number }> {
        //Apply effects that change the value of this condition.
        return zip([
            this._creatureEffectsService
                .absoluteEffectsOnThis$(context.creature, `${ condition.name } Value`),
            this._creatureEffectsService
                .relativeEffectsOnThis$(context.creature, `${ condition.name } Value`),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    let newValue: number = newConditionGain.value || 0;

                    const conditionsToRemove: Array<string> = [];

                    absolutes
                        .forEach(effect => {
                            newValue = effect.setValueNumerical;
                            conditionsToRemove.push(effect.source);
                        });

                    relatives
                        .forEach(effect => {
                            newValue += effect.valueNumerical;
                            conditionsToRemove.push(effect.source);
                        });

                    return ({ conditionsToRemove, newValue });
                }),
            );
    }

    public determineConditionTargets(
        newConditionGain: ConditionGain,
        context: {
            creature: Creature;
            source: Activity | Spell;
            gain: ActivityGain | ItemActivity | SpellGain;
            targets: Array<Creature | SpellTarget>;
        },
    ): Array<Creature | SpellTarget> {
        // Caster conditions are applied to the caster creature only.
        // If the spell/activity is durationDependsOnTarget,
        // there are any foreign targets (whose turns don't end when the caster's turn ends)
        // and it doesn't have a duration of X+1, add 2 for "until another character's turn".
        // This allows the condition to persist until after the caster's last turn,
        // simulating that it hasn't been the target's last turn yet.
        if (newConditionGain.targetFilter === 'caster') {
            if (
                context.source.durationDependsOnTarget &&
                context.targets.some(target => target instanceof SpellTarget) &&
                newConditionGain.duration > 0 &&
                !newConditionGain.durationDependsOnOther
            ) {
                newConditionGain.duration += TimePeriods.UntilOtherCharactersTurn;
            }

            return [context.creature];
        } else {
            return context.targets;
        }
    }

    /**
     * Get each condition where it needs to go, either to a creature or to another player.
     */
    public distributeGainingConditions(
        newConditionGain: ConditionGain,
        conditionTargets: Array<Creature | SpellTarget>,
        source: Activity | Spell,
    ): void {
        //Apply to any non-creature targets whose ID matches your own creatures.
        this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                map(creatures => {
                    //Apply to any targets that are your own creatures.
                    conditionTargets.filter(target => !(target instanceof SpellTarget)).forEach(target => {
                        this._creatureConditionsService.addCondition(target as Creature, newConditionGain, {}, { noReload: true });
                    });

                    conditionTargets
                        .filter(target => target instanceof SpellTarget && creatures.some(listCreature => listCreature.id === target.id))
                        .forEach(target => {
                            const creature = creatures.find(listCreature => listCreature.id === target.id);

                            if (creature) {
                                this._creatureConditionsService.addCondition(
                                    creature,
                                    newConditionGain,
                                    {},
                                    { noReload: true },
                                );
                            }
                        });

                    //Send conditions to non-creature targets that aren't your own creatures.
                    if (newConditionGain.targetFilter !== 'caster' && conditionTargets.some(target => target instanceof SpellTarget)) {
                        // For foreign targets (whose turns don't end when the caster's turn ends),
                        // if the spell/activity is not durationDependsOnTarget, and it doesn't have a duration of X+1,
                        // add 2 for "until another character's turn".
                        // This allows the condition to persist until after the target's last turn,
                        // simulating that it hasn't been the caster's last turn yet.
                        if (
                            !source.durationDependsOnTarget &&
                            newConditionGain.duration > 0 &&
                            !newConditionGain.durationDependsOnOther
                        ) {
                            newConditionGain.duration += TimePeriods.UntilOtherCharactersTurn;
                        }

                        this._messageSendingService.sendConditionToPlayers(
                            conditionTargets
                                .filter((target): target is SpellTarget =>
                                    target instanceof SpellTarget &&
                                    !creatures.some(listCreature => listCreature.id === target.id),
                                ),
                            newConditionGain,
                        );
                    }
                }),
            );
    }

    public removeConditionsToRemove(
        conditionsToRemove: Array<string>,
        context: { creature: Creature },
    ): void {
        if (conditionsToRemove.length) {
            this._creatureConditionsService
                .currentCreatureConditions(context.creature, {}, { readonly: true })
                .filter(conditionGain => conditionsToRemove.includes(conditionGain.name))
                .forEach(conditionGain => {
                    this._creatureConditionsService.removeCondition(context.creature, conditionGain, false);
                });
        }
    }

    private _determineEffectConditionDuration$(
        duration: number,
        condition: Condition,
        context: {
            source: Activity | Spell;
            creature: Creature;
        },
    ): Observable<{ conditionsToRemove: Array<string>; duration: number }> {
        //Check if an effect changes the duration of this condition.
        let effectDuration: number = duration || 0;
        const conditionsToRemove: Array<string> = [];

        const effectNames: Array<string> = [
            `${ condition.name.replace(' (Originator)', '').replace(' (Caster)', '') } Duration`,
        ].concat((context.source instanceof Spell)
            ? ['Next Spell Duration']
            : [],
        );

        return zip([
            this._creatureEffectsService
                .absoluteEffectsOnThese$(
                    context.creature,
                    effectNames,
                ),
            this._creatureEffectsService
                .relativeEffectsOnThese$(
                    context.creature,
                    effectNames,
                ),
        ])
            .pipe(
                map(([absolutes, relatives]) => {
                    absolutes
                        .forEach(effect => {
                            effectDuration = effect.setValueNumerical;
                            conditionsToRemove.push(effect.source);
                        });

                    if (effectDuration > 0) {
                        relatives
                            .forEach(effect => {
                                effectDuration += effect.valueNumerical;
                                conditionsToRemove.push(effect.source);
                            });
                    }

                    // If an effect has changed the duration,
                    // use the effect duration unless it is shorter than the current duration.
                    if (effectDuration) {
                        if (effectDuration === TimePeriods.Permanent) {
                            //Unlimited is longer than anything.
                            duration = TimePeriods.Permanent;
                        } else if (duration !== TimePeriods.Permanent) {
                            //Anything is shorter than unlimited.
                            if (
                                effectDuration < TimePeriods.Permanent &&
                                duration > TimePeriods.NoTurn &&
                                duration < TimePeriods.Day
                            ) {
                                //Until Rest and Until Refocus are usually longer than anything below a day.
                                duration = effectDuration;
                            } else if (effectDuration > duration) {
                                // If neither are unlimited and the above is not true,
                                // a higher value is longer than a lower value.
                                duration = effectDuration;
                            }
                        }
                    }

                    return { conditionsToRemove, duration };
                }),
            );
    }

}
