/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Spell } from 'src/app/classes/Spell';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { CreatureService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';

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
                            CreatureService.character.settings.noHostileCasterConditions :
                            CreatureService.character.settings.noFriendlyCasterConditions
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
    public determineGainedConditionDuration(
        newConditionGain: ConditionGain,
        condition: Condition,
        context: {
            source: Activity | Spell;
            creature: Creature;
            gain: ActivityGain | ItemActivity | SpellGain;
            activityDuration?: number;
        },
        options: { hasTargetCondition: boolean; isCasterATarget: boolean },
    ): Array<string> {
        const conditionsToRemove: Array<string> = [];

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
            newConditionGain.duration = 0;
        } else {
            //If this is a spell that was cast by an activity, it may have a specified duration. Apply that here.
            if (context.activityDuration) {
                newConditionGain.duration = context.activityDuration;
            } else if (newConditionGain.durationIsDynamic) {
                //If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
                newConditionGain.duration =
                    condition.defaultDuration(newConditionGain.choice, newConditionGain.heightened)?.duration;
            }

            const effectConditionDuration =
                this._determineEffectConditionDuration(newConditionGain.duration, condition, { ...context, conditionsToRemove });

            conditionsToRemove.push(...effectConditionDuration.conditionsToRemove);
            newConditionGain.duration = effectConditionDuration.duration;

        }

        return conditionsToRemove;
    }

    public determineGainedConditionChoice(
        newConditionGain: ConditionGain,
        conditionIndex: number,
        condition: Condition,
        context: { gain: ActivityGain | ItemActivity | SpellGain; creature: Creature },
    ): void {
        //Unless the conditionGain has a choice set, try to set it by various factors.
        if (newConditionGain.copyChoiceFrom && context.gain.effectChoices.length) {
            // If the gain has copyChoiceFrom set, use the choice from the designated condition.
            // If there are multiple conditions with the same name, the first is taken.
            newConditionGain.choice =
                context.gain.effectChoices.find(choice => choice.condition === newConditionGain.copyChoiceFrom)?.choice ||
                condition.choice;
        } else if (
            context.gain instanceof SpellGain &&
            context.gain.overrideChoices.length &&
            context.gain.overrideChoices.some(overrideChoice =>
                overrideChoice.condition === condition.name &&
                condition.$choices.includes(overrideChoice.choice),
            )) {
            // If the gain has an override choice prepared that matches this condition and is allowed for it,
            // that choice is used.
            newConditionGain.choice =
                context.gain.overrideChoices
                    .find(overrideChoice =>
                        overrideChoice.condition === condition.name &&
                        condition.$choices.includes(overrideChoice.choice),
                    )?.choice || newConditionGain.choice;
        } else if (newConditionGain.choiceBySubType) {
            // If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType,
            // set the choice to that feat's subType as long as it's a valid choice for the condition.
            const subType =
                (
                    this._characterFeatsService
                        .characterFeatsAndFeatures(newConditionGain.choiceBySubType, '', true, true)
                        .find(feat =>
                            feat.superType === newConditionGain.choiceBySubType &&
                            this._characterFeatsService.characterHasFeat(feat.name),
                        )
                );

            if (subType && condition.choices.map(choice => choice.name).includes(subType.subType)) {
                newConditionGain.choice = subType.subType;
            }
        } else if (context.gain.effectChoices.length) {
            // If this condition has choices, and the activityGain has choices prepared, apply the choice from the gain.
            // The order of gain.effectChoices maps directly onto the order of the conditions,
            // no matter if they have choices.
            if (condition.$choices.includes(context.gain.effectChoices[conditionIndex].choice)) {
                newConditionGain.choice = context.gain.effectChoices[conditionIndex].choice;
            }
        }
    }

    public determineGainedConditionValue(
        newConditionGain: ConditionGain,
        condition: Condition,
        context: { creature: Creature },
    ): Array<string> {
        //Apply effects that change the value of this condition.
        let effectValue: number = newConditionGain.value || 0;

        const conditionsToRemove: Array<string> = [];

        this._creatureEffectsService
            .absoluteEffectsOnThis(context.creature, `${ condition.name } Value`)
            .forEach(effect => {
                effectValue = parseInt(effect.setValue, 10);
                conditionsToRemove.push(effect.source);
            });

        this._creatureEffectsService
            .relativeEffectsOnThis(context.creature, `${ condition.name } Value`)
            .forEach(effect => {
                effectValue += parseInt(effect.value, 10);
                conditionsToRemove.push(effect.source);
            });

        newConditionGain.value = effectValue;

        return conditionsToRemove;
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


        //Apply to any targets that are your own creatures.
        conditionTargets.filter(target => !(target instanceof SpellTarget)).forEach(target => {
            this._creatureConditionsService.addCondition(target as Creature, newConditionGain, {}, { noReload: true });
        });

        //Apply to any non-creature targets whose ID matches your own creatures.
        const creatures = this._creatureAvailabilityService.allAvailableCreatures();

        conditionTargets
            .filter(target => target instanceof SpellTarget && creatures.some(listCreature => listCreature.id === target.id))
            .forEach(target => {
                this._creatureConditionsService.addCondition(
                    CreatureService.creatureFromType(target.type),
                    newConditionGain,
                    {},
                    { noReload: true },
                );
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
                conditionTargets.filter(target =>
                    target instanceof SpellTarget &&
                    !creatures.some(listCreature => listCreature.id === target.id),
                ) as Array<SpellTarget>, newConditionGain,
            );
        }
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

    private _determineEffectConditionDuration(
        duration: number,
        condition: Condition,
        context: {
            source: Activity | Spell;
            creature: Creature;
            conditionsToRemove: Array<string>;
        },
    ): { conditionsToRemove: Array<string>; duration: number } {
        //Check if an effect changes the duration of this condition.
        let effectDuration: number = duration || 0;
        const conditionsToRemove = context.conditionsToRemove;

        const effectNames: Array<string> = [
            `${ condition.name.replace(' (Originator)', '').replace(' (Caster)', '') } Duration`,
        ].concat((context.source instanceof Spell)
            ? ['Next Spell Duration']
            : [],
        );

        this._creatureEffectsService
            .absoluteEffectsOnThese(
                context.creature,
                effectNames,
            )
            .forEach(effect => {
                effectDuration = parseInt(effect.setValue, 10);
                context.conditionsToRemove.push(effect.source);
            });

        if (effectDuration > 0) {
            this._creatureEffectsService
                .relativeEffectsOnThese(
                    context.creature,
                    effectNames,
                ).forEach(effect => {
                    effectDuration += parseInt(effect.value, 10);
                    context.conditionsToRemove.push(effect.source);
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
    }

}
