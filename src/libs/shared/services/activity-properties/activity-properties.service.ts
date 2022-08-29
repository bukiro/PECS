import { Injectable } from '@angular/core';
import { Activity, ActivityTargetOptions } from 'src/app/classes/Activity';
import { Creature } from 'src/app/classes/Creature';
import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { Spell } from 'src/app/classes/Spell';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Defaults } from '../../definitions/defaults';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureActivitiesService } from '../creature-activities/creature-activities.service';

@Injectable({
    providedIn: 'root',
})
export class ActivityPropertiesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public allowedTargetNumber(activity: Activity | Spell, levelNumber: number): number {
        //You can select any number of targets for an area spell.
        if (activity.target === ActivityTargetOptions.Area) {
            return -1;
        }

        let targetNumberResult: SpellTargetNumber | undefined;

        // This descends from levelnumber downwards and returns the first available targetNumber that has the required feat (if any).
        // Prefer targetNumbers with required feats over those without.
        // If no targetNumbers are configured, return 1 for an ally activity and 0 for any other, and if none have a minLevel,
        // return the first that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        if (activity.targetNumbers.length) {
            if (activity.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
                let remainingLevelNumber = levelNumber;

                for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                    if (activity.targetNumbers.some(targetNumber => targetNumber.minLevel === remainingLevelNumber)) {
                        targetNumberResult =
                            activity.targetNumbers.find(targetNumber =>
                                (targetNumber.minLevel === remainingLevelNumber) &&
                                targetNumber.featreq &&
                                this._characterFeatsService.characterHasFeat(targetNumber.featreq),
                            );

                        if (!targetNumberResult) {
                            targetNumberResult =
                                activity.targetNumbers.find(targetNumber => targetNumber.minLevel === remainingLevelNumber);
                        }

                        if (targetNumberResult) {
                            return targetNumberResult.number;
                        }
                    }
                }

                return activity.targetNumbers[0].number;
            } else {
                targetNumberResult =
                    activity.targetNumbers.find(targetNumber =>
                        targetNumber.featreq &&
                        this._characterFeatsService.characterHasFeat(targetNumber.featreq),
                    );

                return targetNumberResult?.number || activity.targetNumbers[0].number;
            }
        } else {
            if (activity.target === ActivityTargetOptions.Ally) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    public cacheMaxCharges(activity: Activity, context: { creature: Creature }): void {
        //Add any effects to the number of charges you have. If you have none, start with 1, and if the result then remains 1, return 0.
        let charges = activity.charges;
        let isStartingWithZero = false;

        if (charges === 0) {
            isStartingWithZero = true;
            charges = 1;
        }

        this._creatureEffectsService.absoluteEffectsOnThis(context.creature, `${ activity.name } Charges`)
            .forEach(effect => {
                charges = parseInt(effect.setValue, 10);
            });
        this._creatureEffectsService.relativeEffectsOnThis(context.creature, `${ activity.name } Charges`)
            .forEach(effect => {
                charges += parseInt(effect.value, 10);
            });

        if (isStartingWithZero && charges === 1) {
            activity.$charges = 0;
        } else {
            activity.$charges = charges;
        }
    }

    public cacheEffectiveCooldown(activity: Activity, context: { creature: Creature }): void {
        //Add any effects to the activity's cooldown.
        let cooldown = activity.cooldown;

        //Use get_AbsolutesOnThese() because it allows to prefer lower values. We still sort the effects in descending setValue.
        this._creatureEffectsService.absoluteEffectsOnThese(context.creature, [`${ activity.name } Cooldown`], { lowerIsBetter: true })
            .sort((a, b) => parseInt(b.setValue, 10) - parseInt(a.setValue, 10))
            .forEach(effect => {
                cooldown = parseInt(effect.setValue, 10);
            });
        //Use get_RelativesOnThese() because it allows to prefer lower values. We still sort the effects in descending value.
        this._creatureEffectsService.relativeEffectsOnThese(context.creature, [`${ activity.name } Cooldown`], { lowerIsBetter: true })
            .sort((a, b) => parseInt(b.value, 10) - parseInt(a.value, 10))
            .forEach(effect => {
                cooldown += parseInt(effect.value, 10);
            });

        // If the cooldown has changed from the original or the current value,
        // update all activity gains that refer to this condition to lower their active cooldown if necessary.
        this._updateDependentActivityGainCooldown(activity, cooldown, context);

        activity.$cooldown = cooldown;
    }

    public heightenedText(activity: Activity, text: string, levelNumber: number): string {
        // For an arbitrary text (usually the activity description or the saving throw result descriptions),
        // retrieve the appropriate description set for this level and replace the variables with the included strings.
        let heightenedText = text;

        this._effectiveDescriptionSet(activity, levelNumber).descs.forEach((descVar: HeightenedDesc) => {
            const regex = new RegExp(descVar.variable, 'g');

            heightenedText = heightenedText.replace(regex, (descVar.value || ''));
        });

        return heightenedText;
    }

    private _effectiveDescriptionSet(activity: Activity, levelNumber: number): HeightenedDescSet {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (activity.heightenedDescs.length) {
            let remainingLevelNumber = levelNumber;

            for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                const foundDescSet = activity.heightenedDescs.find(descSet => descSet.level === remainingLevelNumber);

                if (foundDescSet) {
                    return foundDescSet;
                }
            }
        }

        return new HeightenedDescSet();
    }

    private _updateDependentActivityGainCooldown(activity: Activity, cooldown: number, context: { creature: Creature }): void {
        if (activity.cooldown !== cooldown || activity.$cooldown !== cooldown) {
            this._creatureActivitiesService
                .creatureOwnedActivities(context.creature, Defaults.maxCharacterLevel, true)
                .filter(gain => gain.name === activity.name)
                .forEach(gain => {
                    gain.activeCooldown = Math.min(gain.activeCooldown, cooldown);
                });
        }
    }

}
