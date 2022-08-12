/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { TimePeriods } from '../../definitions/timePeriods';
import { SpellTargetSelection } from '../../definitions/Types/spellTargetSelection';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';

@Injectable({
    providedIn: 'root',
})
export class SpellProcessingService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _effectsService: EffectsService,
        private readonly _characterService: CharacterService,
    ) { }


    public processSpell(
        spell: Spell,
        activated: boolean,
        context: {
            creature: Creature;
            gain: SpellGain;
            level: number;
            casting?: SpellCasting;
            choice?: SpellChoice;
            target?: SpellTargetSelection;
            activityGain?: ActivityGain;
        },
        options: { manual?: boolean; expendOnly?: boolean } = {},
    ): void {
        context = { target: '', ...context };

        //Cantrips and Focus spells are automatically heightened to your maximum available spell level.
        //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
        const spellLevel: number =
            this._spellsService.effectiveSpellLevel(
                spell,
                { baseLevel: context.level, creature: context.creature, gain: context.gain },
            );

        // If this spell was cast by an activity, it may have a specified duration in the spellGain.
        // Keep that here before the duration is changed to keep the spell active (or not).
        // That spellGain is a temporary object with its duration coming from the spellCast object,
        // and its duration can be freely changed without influencing the next time you cast the spell.
        let activityDuration = 0;
        let customDuration: number = spell.sustained || 0;

        if (activated && context.gain.duration) {
            customDuration = activityDuration = context.gain.duration;
        }

        if (activated && context.choice?.cooldown && !context.gain.activeCooldown) {
            //Start cooldown.
            context.gain.activeCooldown = context.choice.cooldown;
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }

        if (context.choice?.charges) {
            context.gain.chargesUsed += 1;
        }

        //The conditions listed in conditionsToRemove will be removed after the spell is processed.
        const conditionsToRemove: Array<string> = [];

        if (!options.expendOnly && activated && spell.sustained) {
            context.gain.active = true;
            //If an effect changes the duration of this spell, change the duration here only if it is sustained.
            this._effectsService
                .absoluteEffectsOnThese(context.creature, ['Next Spell Duration', `${ spell.name } Duration`])
                .forEach(effect => {
                    customDuration = parseInt(effect.setValue, 10);
                    conditionsToRemove.push(effect.source);
                });
            this._effectsService
                .relativeEffectsOnThese(context.creature, ['Next Spell Duration', `${ spell.name } Duration`])
                .forEach(effect => {
                    customDuration += parseInt(effect.value, 10);
                    conditionsToRemove.push(effect.source);
                });
            context.gain.duration = customDuration || spell.sustained;
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
            context.gain.selectedTarget = context.target;
        } else if (!options.expendOnly && activated && context.activityGain?.active) {
            context.gain.active = true;
            context.gain.duration = context.activityGain?.duration;
            context.gain.selectedTarget = context.target;
        } else {
            context.gain.active = false;
            context.gain.duration = 0;
            context.gain.selectedTarget = '';
        }

        //In manual mode, targets and conditions are not processed.
        if (!options.expendOnly && !this._characterService.isManualMode) {

            //Find out if target was given. If no target is set, most effects will not be applied.
            const targets: Array<Creature | SpellTarget> = [];

            switch (context.target) {
                case 'self':
                    targets.push(context.creature);
                    break;
                case CreatureTypes.Character:
                    targets.push(this._characterService.character);
                    break;
                case 'Companion':
                    targets.push(this._characterService.companion);
                    break;
                case 'Familiar':
                    targets.push(this._characterService.familiar);
                    break;
                case 'Selected':
                    if (context.gain) {
                        targets.push(...context.gain.targets.filter(target => target.selected));
                    }

                    break;
                default: break;
            }

            //Apply conditions.
            //Remove conditions only if the spell was deactivated manually, i.e. if you want the condition to end.
            //If the spell ends by the time running out, the condition will also have a timer and run out by itself.
            //This allows us to manually change the duration for a condition and keep it running when the spell runs out
            // (because it's much more difficult to change the spell duration -and- the condition duration).
            if (spell.heightenedConditions(spellLevel)) {
                if (activated) {
                    const conditions: Array<ConditionGain> = spell.heightenedConditions(spellLevel);
                    const hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter !== 'caster');
                    const hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter === 'caster');
                    const isCasterATarget: boolean = targets.some(target => target.id === context.creature.id);
                    //Do the target and the caster get the same condition?
                    const isCasterConditionSameAsTargetCondition: boolean =
                        hasTargetCondition &&
                        hasCasterCondition &&
                        Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length === 1;

                    conditions.forEach((conditionGain, conditionIndex) => {
                        const newConditionGain = Object.assign(new ConditionGain(), conditionGain).recast();
                        const condition = this._conditionsDataService.conditionFromName(conditionGain.name);

                        //Unless the conditionGain has a choice set, try to set it by various factors.
                        if (!conditionGain.choice) {
                            if (conditionGain.copyChoiceFrom && context.gain.effectChoices.length) {
                                // If the gain has copyChoiceFrom set, use the choice from the designated condition.
                                // If there are multiple conditions with the same name, the first is taken.
                                newConditionGain.choice =
                                    context.gain.effectChoices
                                        .find(choice => choice.condition === conditionGain.copyChoiceFrom)
                                        ?.choice
                                    || condition.choice;
                            } else if (
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
                                        ).choice;
                            } else if (newConditionGain.choiceBySubType) {
                                // If there is a choiceBySubType value, and you have a feat with superType == choiceBySubType,
                                // set the choice to that feat's subType as long as it's a valid choice for the condition.
                                const subType =
                                    this._characterService
                                        .characterFeatsAndFeatures(newConditionGain.choiceBySubType, '', true, true)
                                        .find(feat =>
                                            feat.superType === newConditionGain.choiceBySubType &&
                                            feat.have({ creature: context.creature }, { characterService: this._characterService }));

                                if (subType && condition.choices.some(choice => choice.name === subType.subType)) {
                                    newConditionGain.choice = subType.subType;
                                }
                            } else if (context.gain.effectChoices.length) {
                                // If this condition has choices, and the spellGain has choices prepared, apply the choice from the gain.
                                // The order of gain.effectChoices maps directly onto the order of the conditions,
                                // no matter if they have choices.
                                if (condition.$choices.includes(context.gain.effectChoices[conditionIndex].choice)) {
                                    newConditionGain.choice = context.gain.effectChoices[conditionIndex].choice;
                                }
                            }
                        }

                        //Under certain circumstances, don't grant caster conditions:
                        // - If there is a target condition, the caster is also a target,
                        //   and the caster and the targets get the same condition.
                        // - If there is a target condition, the caster is also a target,
                        //   and the caster condition is purely informational.
                        //   This can be overriden by setting alwaysApplyCasterCondition on the condition.
                        // - If the spell is hostile, hostile caster conditions are disabled, the caster condition is purely informational,
                        //   and the spell allows targeting the caster
                        //   (which is always the case for hostile spells because they don't have target conditions).
                        // - If the spell is friendly, friendly caster conditions are disabled,
                        //   the caster condition is purely informational, and the spell allows targeting the caster
                        //   (otherwise, it must be assumed that the caster condition is necessary).
                        if (
                            !(
                                conditionGain.targetFilter === 'caster' &&
                                (
                                    (
                                        hasTargetCondition &&
                                        isCasterATarget &&
                                        (
                                            isCasterConditionSameAsTargetCondition ||
                                            (
                                                !condition.alwaysApplyCasterCondition &&
                                                !condition.hasEffects() &&
                                                !condition.isChangeable()
                                            )
                                        )
                                    ) ||
                                    (
                                        (
                                            spell.isHostile() ?
                                                this._characterService.character.settings.noHostileCasterConditions :
                                                this._characterService.character.settings.noFriendlyCasterConditions
                                        ) &&
                                        (
                                            !condition.hasEffects() &&
                                            !condition.isChangeable() &&
                                            !spell.cannotTargetCaster
                                        )
                                    )
                                )
                            )
                        ) {
                            // Pass the spell level in case that condition effects change with level -
                            // but only if the conditionGain doesn't have its own heightened value.
                            if (!newConditionGain.heightened || newConditionGain.heightened < condition.minLevel) {
                                newConditionGain.heightened = Math.max(spellLevel, condition.minLevel);
                            }

                            //Pass the spellcasting ability in case the condition needs to use the modifier
                            if (context.casting) {
                                newConditionGain.spellCastingAbility = context.casting.ability;
                            }

                            newConditionGain.spellSource = context.gain?.source || '';
                            newConditionGain.sourceGainID = context.gain?.id || '';

                            if (
                                conditionGain.targetFilter === 'caster' &&
                                hasTargetCondition &&
                                isCasterATarget &&
                                !condition.alwaysApplyCasterCondition &&
                                !condition.isChangeable() &&
                                !condition.hasDurationEffects() &&
                                condition.hasInstantEffects()
                            ) {
                                // If the condition is only granted because it has instant effects,
                                // we set the duration to 0, so it can do its thing and then leave.
                                newConditionGain.duration = 0;
                            } else {
                                //If this spell was cast by an activity, it may have a specified duration. Apply that here.
                                if (activityDuration) {
                                    newConditionGain.duration = activityDuration;
                                } else if (newConditionGain.durationIsDynamic) {
                                    // Otherwise, and if the conditionGain has duration -5,
                                    // use the default duration depending on spell level and effect choice.
                                    newConditionGain.duration =
                                        condition.defaultDuration(newConditionGain.choice, newConditionGain.heightened).duration;
                                }

                                //Check if an effect changes the duration of this condition.
                                let effectDuration: number = newConditionGain.duration || 0;

                                this._effectsService
                                    .absoluteEffectsOnThese(
                                        context.creature,
                                        [
                                            'Next Spell Duration',
                                            `${ condition.name.replace(' (Originator)', '').replace(' (Caster)', '') } Duration`,
                                        ],
                                    )
                                    .forEach(effect => {
                                        effectDuration = parseInt(effect.setValue, 10);
                                        conditionsToRemove.push(effect.source);
                                    });

                                if (effectDuration > 0) {
                                    this._effectsService
                                        .relativeEffectsOnThese(
                                            context.creature,
                                            [
                                                'Next Spell Duration',
                                                `${ condition.name.replace(' (Originator)', '').replace(' (Caster)', '') } Duration`,
                                            ],
                                        )
                                        .forEach(effect => {
                                            effectDuration += parseInt(effect.value, 10);
                                            conditionsToRemove.push(effect.source);
                                        });
                                }

                                //If an effect changes the duration, use the effect duration unless it is shorter than the current duration.
                                if (effectDuration) {
                                    if (effectDuration === -1) {
                                        //Unlimited is longer than anything.
                                        newConditionGain.duration = -1;
                                    } else if (newConditionGain.duration !== -1) {
                                        //Anything is shorter than unlimited.
                                        if (
                                            effectDuration < -1 &&
                                            newConditionGain.duration > 0 &&
                                            newConditionGain.duration < TimePeriods.Day
                                        ) {
                                            //Until Rest and Until Refocus are usually longer than anything below a day.
                                            newConditionGain.duration = effectDuration;
                                        } else if (effectDuration > newConditionGain.duration) {
                                            // If neither are unlimited and the above is not true,
                                            // a higher value is longer than a lower value.
                                            newConditionGain.duration = effectDuration;
                                        }
                                    }
                                }
                            }

                            if (condition.hasValue) {
                                //Apply effects that change the value of this condition.
                                let effectValue: number = newConditionGain.value || 0;

                                this._effectsService
                                    .absoluteEffectsOnThis(context.creature, `${ condition.name } Value`)
                                    .forEach(effect => {
                                        effectValue = parseInt(effect.setValue, 10);
                                        conditionsToRemove.push(effect.source);
                                    });
                                this._effectsService
                                    .relativeEffectsOnThis(context.creature, `${ condition.name } Value`)
                                    .forEach(effect => {
                                        effectValue += parseInt(effect.value, 10);
                                        conditionsToRemove.push(effect.source);
                                    });
                                newConditionGain.value = effectValue;
                            }

                            /* #Experimental, not needed so far
                            // Add caster data, if a formula exists.
                            if (conditionGain.casterDataFormula) {
                                newConditionGain.casterData = services.characterService.effectsService.get_ValueFromFormula(
                                    conditionGain.casterDataFormula,
                                    context.creature,
                                    services.characterService,
                                    conditionGain,
                                );
                            }
                            */

                            let conditionTargets: Array<Creature | SpellTarget> = targets;

                            // Caster conditions are applied to the caster creature only.
                            // If the spell is durationDependsOnTarget,
                            // there are any foreign targets (whose turns don't end when the caster's turn ends)
                            // and it doesn't have a duration of X+1, add 2 for "until another character's turn".
                            // This allows the condition to persist until after the caster's last turn,
                            // simulating that it hasn't been the target's last turn yet.
                            if (conditionGain.targetFilter === 'caster') {
                                conditionTargets = [context.creature];

                                if (
                                    spell.durationDependsOnTarget &&
                                    targets.some(target => target instanceof SpellTarget) &&
                                    newConditionGain.duration > 0 &&
                                    !newConditionGain.durationDependsOnOther
                                ) {
                                    newConditionGain.duration += TimePeriods.UntilOtherCharactersTurn;
                                }
                            }

                            //Apply to any targets that are your own creatures.
                            conditionTargets.filter(target => !(target instanceof SpellTarget)).forEach(target => {
                                this._creatureConditionsService.addCondition(target as Creature, newConditionGain, {}, { noReload: true });
                            });

                            //Apply to any non-creature targets whose ID matches your own creatures.
                            const creatures = this._characterService.allAvailableCreatures();

                            conditionTargets
                                .filter(target => target instanceof SpellTarget && creatures.some(creature => creature.id === target.id))
                                .forEach(target => {
                                    this._creatureConditionsService.addCondition(
                                        this._characterService.creatureFromType(target.type),
                                        newConditionGain,
                                        {},
                                        { noReload: true },
                                    );
                                });

                            //Send conditions to non-creature targets that aren't your own creatures.
                            if (conditionGain.targetFilter !== 'caster' && conditionTargets.some(target => target instanceof SpellTarget)) {
                                // For foreign targets (whose turns don't end when the caster's turn ends),
                                // if the spell is not durationDependsOnTarget, and it doesn't have a duration of X+1,
                                // add 2 for "until another character's turn".
                                // This allows the condition to persist until after the target's last turn,
                                // simulating that it hasn't been the caster's last turn yet.
                                if (
                                    !spell.durationDependsOnTarget &&
                                    newConditionGain.duration > 0 &&
                                    !newConditionGain.durationDependsOnOther
                                ) {
                                    newConditionGain.duration += TimePeriods.UntilOtherCharactersTurn;
                                }

                                this._characterService
                                    .sendConditionToPlayers(
                                        conditionTargets.filter(target =>
                                            target instanceof SpellTarget &&
                                            !creatures.some(creature => creature.id === target.id),
                                        ) as Array<SpellTarget>,
                                        newConditionGain,
                                        true,
                                    );
                            }
                        }
                    });
                } else if (options.manual) {
                    // Only if the spell was ended manually, find the matching conditions and end them.
                    // If the spell ran out, let the conditions run out by themselves.
                    spell.heightenedConditions(spellLevel).forEach(conditionGain => {
                        const conditionTargets: Array<Creature | SpellTarget> =
                            (conditionGain.targetFilter === 'caster' ? [context.creature] : targets);

                        conditionTargets
                            .filter(target => !(target instanceof SpellTarget))
                            .forEach((target: Creature) => {
                                this._creatureConditionsService.currentCreatureConditions(target, { name: conditionGain.name })
                                    .filter(existingConditionGain =>
                                        existingConditionGain.source === conditionGain.source &&
                                        existingConditionGain.sourceGainID === (context.gain?.id || ''),
                                    )
                                    .forEach(existingConditionGain => {
                                        this._creatureConditionsService.removeCondition(target as Creature, existingConditionGain, false);
                                    });
                            });
                        this._characterService
                            .sendConditionToPlayers(
                                conditionTargets.filter(target => target instanceof SpellTarget) as Array<SpellTarget>,
                                conditionGain,
                                false,
                            );
                    });
                }
            }

        }

        //All Conditions that have affected the duration of this spell or its conditions are now removed.
        if (conditionsToRemove.length) {
            this._creatureConditionsService
                .currentCreatureConditions(context.creature, {}, { readonly: true })
                .filter(conditionGain => conditionsToRemove.includes(conditionGain.name))
                .forEach(conditionGain => {
                    this._creatureConditionsService.removeCondition(context.creature, conditionGain, false);
                });
        }

        //The Heal Spell from the Divine Font should update effects, because Channeled Succor depends on it.
        if (spell.name === 'Heal' && context.choice?.source === 'Divine Font') {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        }
    }

}
