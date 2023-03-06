import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellTargetSelection } from 'src/libs/shared/definitions/types/spellTargetSelection';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { SpellTargetService } from 'src/libs/shared/services/spell-target/spell-target.service';

@Injectable({
    providedIn: 'root',
})
export class SpellProcessingService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _spellTargetService: SpellTargetService,
        private readonly _messageSendingService: MessageSendingService,
        private readonly _recastService: RecastService,
        private readonly _psp: ProcessingServiceProvider,
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
        context.target = context.target || '';

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
        const activityDuration = context.gain.duration || 0;

        if (activated && context.choice?.cooldown && !context.gain.activeCooldown) {
            //Start cooldown if the choice has a cooldown and there isn't one running already.
            context.gain.activeCooldown = context.choice.cooldown;
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }

        if (context.choice?.charges) {
            context.gain.chargesUsed += 1;
        }

        //The conditions listed in conditionsToRemove will be removed after the spell is processed.
        const conditionsToRemove: Array<string> = [];

        if (!options.expendOnly && activated && spell.sustained) {
            //Determine the spell's sustain duration and save the names of the conditions that influenced it and can be removed.
            conditionsToRemove.push(...this._activateSustainedSpell(spell, context));
        } else if (!options.expendOnly && activated && context.activityGain?.active) {
            //Activate the spellGain if it comes from an activated activity.
            context.gain.active = true;
            context.gain.duration = context.activityGain.duration;
            context.gain.selectedTarget = context.target;
        } else {
            //Spells that are not sustained and don't go alongside an activated activity should not be activated.
            context.gain.active = false;
            context.gain.duration = 0;
            context.gain.selectedTarget = '';
        }

        //Apply conditions unless in manual mode or if the spell was only expended.
        if (!options.expendOnly && !SettingsService.isManualMode) {

            //Find out who needs to gain or lose conditions. If no targets are set, conditions will not be applied.
            const targets = this._spellTargetService.determineTargetsFromSpellTarget(context.target, context);

            //Apply conditions.
            //Remove conditions only if the spell was deactivated manually, i.e. if you want the condition to end.
            //If the spell ends by the time running out, the condition will also have a timer and run out by itself.
            //This allows us to manually change the duration for a condition and keep it running when the spell runs out
            // (because it's much more difficult to change the spell duration -and- the condition duration).
            const conditions: Array<ConditionGain> = spell.heightenedConditions(spellLevel);

            if (conditions.length) {
                if (activated) {
                    //Apply conditions and save the names of the conditions that influenced their duration.
                    conditionsToRemove.push(
                        ...this._applyGainingConditions(spell, conditions, { ...context, spellLevel, activityDuration, targets }),
                    );
                } else if (options.manual) {
                    // Only if the spell was ended manually, find the matching conditions and end them.
                    this._applyLosingConditions(spell, targets, { ...context, spellLevel });
                }
            }

        }

        //All Conditions that have affected the duration of this spell or its conditions are now removed.
        this._psp.spellActivityProcessingSharedService?.removeConditionsToRemove(conditionsToRemove, context);

        //The Heal Spell from the Divine Font should update effects, because Channeled Succor depends on it.
        if (spell.name === 'Heal' && context.choice?.source === 'Divine Font') {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        }
    }

    /**
     * For a sustained spell, activate the spellGain and set its duration properly.
     * The duration can be influenced by condition effects.
     *
     * Returns the names of the conditions that should be removed after they changed the sustain duration.
     */
    private _activateSustainedSpell(
        spell: Spell,
        context: { gain: SpellGain; creature: Creature; target?: SpellTargetSelection; activityGain?: ActivityGain },
    ): Array<string> {
        context.target = context.target || '';

        const conditionsToRemove: Array<string> = [];

        let customDuration: number = context.gain.duration || spell.sustained || 0;

        context.gain.active = true;
        //If an effect changes the duration of this spell, change the duration here only if it is sustained.
        this._creatureEffectsService
            .absoluteEffectsOnThese(context.creature, ['Next Spell Duration', `${ spell.name } Duration`])
            .forEach(effect => {
                customDuration = parseInt(effect.setValue, 10);
                conditionsToRemove.push(effect.source);
            });
        this._creatureEffectsService
            .relativeEffectsOnThese(context.creature, ['Next Spell Duration', `${ spell.name } Duration`])
            .forEach(effect => {
                customDuration += parseInt(effect.value, 10);
                conditionsToRemove.push(effect.source);
            });
        context.gain.duration = customDuration || spell.sustained;
        this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');

        context.gain.selectedTarget = context.target;

        return conditionsToRemove;
    }

    private _applyGainingConditions(
        spell: Spell,
        conditions: Array<ConditionGain>,

        context: {
            creature: Creature;
            gain: SpellGain;
            targets: Array<Creature | SpellTarget>;
            spellLevel: number;
            casting?: SpellCasting;
            activityDuration: number;
        },
    ): Array<string> {
        const conditionsToRemove: Array<string> = [];

        const hasTargetCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter !== 'caster');
        const hasCasterCondition: boolean = conditions.some(conditionGain => conditionGain.targetFilter === 'caster');
        const isCasterATarget: boolean = context.targets.some(target => target.id === context.creature.id);

        //Do the target and the caster get the same condition?
        const isCasterConditionSameAsTargetCondition: boolean =
            hasTargetCondition &&
            hasCasterCondition &&
            Array.from(new Set(conditions.map(conditionGain => conditionGain.name))).length === 1;

        conditions.forEach((conditionGain, conditionIndex) => {
            const newConditionGain = Object.assign(new ConditionGain(), conditionGain).recast(this._recastService.restoreFns);
            const condition = this._conditionsDataService.conditionFromName(conditionGain.name);

            //Under certain circumstances, don't grant a condition.
            if (
                this._psp.spellActivityProcessingSharedService?.shouldGainCondition(
                    spell,
                    newConditionGain,
                    condition,
                    { hasTargetCondition, isCasterATarget, isCasterConditionSameAsTargetCondition },
                )
            ) {
                // Pass the spell level in case that condition effects change with level -
                // but only if the conditionGain doesn't have its own heightened value.
                if (!newConditionGain.heightened || newConditionGain.heightened < condition.minLevel) {
                    newConditionGain.heightened = Math.max(context.spellLevel, condition.minLevel);
                }

                //Pass the spellcasting ability in case the condition needs to use the modifier
                if (context.casting) {
                    newConditionGain.spellCastingAbility = context.casting.ability;
                }

                newConditionGain.spellSource = context.gain?.source || '';
                newConditionGain.sourceGainID = context.gain?.id || '';

                //Unless the conditionGain has a choice set, try to set it by various factors.
                if (!conditionGain.choice) {
                    this._psp.spellActivityProcessingSharedService.determineGainedConditionChoice(
                        newConditionGain,
                        conditionIndex,
                        condition,
                        context,
                    );
                }

                //Determine the condition's duration and save the names of the conditions that influenced it.
                conditionsToRemove.push(
                    ...this._psp.spellActivityProcessingSharedService.determineGainedConditionDuration(
                        newConditionGain,
                        condition,
                        { ...context, source: spell },
                        { hasTargetCondition, isCasterATarget },
                    ),
                );

                if (condition.hasValue) {
                    //Determine the condition's value and save the names of the conditions that influenced it.
                    conditionsToRemove.push(
                        ...this._psp.spellActivityProcessingSharedService.determineGainedConditionValue(
                            newConditionGain,
                            condition,
                            context,
                        ),
                    );
                }

                const conditionTargets = this._psp.spellActivityProcessingSharedService.determineConditionTargets(
                    newConditionGain,
                    { ...context, source: spell },
                );

                this._psp.spellActivityProcessingSharedService.distributeGainingConditions(
                    newConditionGain,
                    conditionTargets,
                    spell,
                );
            }
        });

        return conditionsToRemove;
    }

    private _applyLosingConditions(
        spell: Spell,
        targets: Array<Creature | SpellTarget>,
        context: { creature: Creature; gain: SpellGain; spellLevel: number },
    ): void {
        // Only if the spell was ended manually, find the matching conditions and end them.
        // If the spell ran out, let the conditions run out by themselves.
        spell.heightenedConditions(context.spellLevel).forEach(conditionGain => {
            const conditionTargets: Array<Creature | SpellTarget> =
                (conditionGain.targetFilter === 'caster' ? [context.creature] : targets);

            conditionTargets
                .filter(target => !(target instanceof SpellTarget))
                .forEach(target => {
                    if (!(target instanceof SpellTarget)) {
                        this._creatureConditionsService.currentCreatureConditions(target, { name: conditionGain.name })
                            .filter(existingConditionGain =>
                                existingConditionGain.source === conditionGain.source &&
                                existingConditionGain.sourceGainID === (context.gain?.id || ''),
                            )
                            .forEach(existingConditionGain => {
                                this._creatureConditionsService.removeCondition(target, existingConditionGain, false);
                            });
                    }

                });
            this._messageSendingService
                .sendConditionToPlayers(
                    conditionTargets.filter((target): target is SpellTarget => target instanceof SpellTarget),
                    conditionGain,
                    false,
                );
        });
    }

}
