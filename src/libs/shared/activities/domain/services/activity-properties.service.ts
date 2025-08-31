import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { weaklyCachedSignal, weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { HeightenedDescriptionVariable } from 'src/libs/shared/heightened-description/util/models/heightened-description-variable';
import { HeightenedDescriptionVariableCollection } from 'src/libs/shared/heightened-description/util/models/heightened-description-variable-collection';
import { Spell } from 'src/libs/shared/spells/util/models/spell';
import { SpellTargetNumber } from 'src/libs/shared/spells/util/models/spell-target-number';
import { Activity } from '../../util/models/activity';
import { activityTargetOption } from '../../util/models/activity-target-options';
import { CreatureEffectsService } from 'src/libs/shared/effects/domain/services/creature-effects.service';
import { applyEffectsToValue } from 'src/libs/shared/effects/util/utils/effect-utils';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';

export const anyTargetNumber$$ = signal(-1).asReadonly();
export const zeroTargetNumber$$ = signal(0).asReadonly();
export const singleTargetNumber$$ = signal(1).asReadonly();

@Injectable({
    providedIn: 'root',
})
export class ActivityPropertiesService {

    private readonly _creatureEffectsService = inject(CreatureEffectsService);

    private readonly _cache = {
        allowedTargetNumber: new WeakMap<Activity | Spell, Map<number, Signal<number>>>(),
    };

    public allowedTargetNumber$$(activity: Activity | Spell, levelNumber: number): Signal<number> {
        //You can select any number of targets for an area spell.
        if (activity.target === activityTargetOption.area) {
            return anyTargetNumber$$;
        }

        // This descends from levelnumber downwards and returns the first available targetNumber
        //  that has the required feat or requires no feat,
        //  preferring targetNumbers with required feats over those without.
        // If no targetNumbers are configured, return 1 for an ally activity and 0 for any other, and if none have a minLevel,
        // return the first that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        if (!activity.targetNumbers.length) {
            if (activity.target === activityTargetOption.ally) {
                return singleTargetNumber$$;
            } else {
                return zeroTargetNumber$$;
            }
        }

        return weaklyCachedSignalWithKey(
            () => {
                if (!activity.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
                    return computed(() => {
                        const matchingTargetNumber =
                            activity.targetNumbers
                                .filter(targetNumber => targetNumber.featreq)
                                .find(targetNumber => CreatureService.character$$().featsAdapter.matchesFeatReq$$(targetNumber.featreq)());

                        return matchingTargetNumber?.number
                            ?? activity.targetNumbers[0]?.number
                            ?? 0;
                    });
                }

                let remainingLevelNumber = levelNumber;

                const targetNumbersWithFeatreq: Array<SpellTargetNumber> = [];
                let firstTargetNumberWithoutFeatreq: SpellTargetNumber | undefined;

                for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                    if (!firstTargetNumberWithoutFeatreq) {
                        const targetNumbersAtLevel =
                            activity.targetNumbers
                                .filter(targetNumber => targetNumber.minLevel === remainingLevelNumber);

                        if (targetNumbersAtLevel.length) {
                            // Add all targetNumbers on this level with required feat to the list to check for the feats.
                            // The feat check is asynchronous, so this can't be done within the loop.
                            targetNumbersWithFeatreq.push(
                                ...targetNumbersAtLevel
                                    .filter(targetNumber => targetNumber.featreq),
                            );

                            // The first targetNumber without required feat will be the chosen
                            //  if the previous ones with required feat all don't apply.
                            // As soon as this is found, the remaining levels will not be checked.
                            firstTargetNumberWithoutFeatreq =
                                activity.targetNumbers.find(targetNumber => !targetNumber.featreq);
                        }
                    }
                }

                // Now check for feats and use:
                // - the first targetNumber that has the required feat,
                // - or the first targetNumber without required feat,
                // - or the first targetNumber altogether.
                return computed(() => {
                    const matchingTargetNumber =
                        targetNumbersWithFeatreq
                            .find(targetNumber => CreatureService.character$$().featsAdapter.matchesFeatReq$$(targetNumber.featreq)());

                    return matchingTargetNumber?.number
                        ?? firstTargetNumberWithoutFeatreq?.number
                        ?? activity.targetNumbers[0]?.number
                        ?? 0;
                });
            },
            { store: this._cache.allowedTargetNumber, objKey: activity, key: levelNumber },
        );
    }

    /**
     * Creates an observable for the effective cooldown for this activity and this creature,
     * then saves it on the activity for later use and returns it.
     * If the observable exists on the activity already, just returns it.
     */
    public effectiveMaxCharges$$(activity: Activity, { creature }: { creature: Creature }): Signal<number> {
        return weaklyCachedSignal(
            () => {
                const absoluteEffects$$ =
                    this._creatureEffectsService.absoluteEffectsOnThis$$(creature, `${ activity.name } Charges`);
                const relativeEffects$$ =
                    this._creatureEffectsService.relativeEffectsOnThis$$(creature, `${ activity.name } Charges`);

                return computed(() => {
                    const absoluteEffects = absoluteEffects$$();
                    const relativeEffects = relativeEffects$$();

                    // Add any effects to the number of charges you have.
                    // If you have none, start with 1, and if the result then remains 1, go back to 0.
                    // This is to ensure an activity that has no charges
                    //  and gets more charges is treated like an activity that had 1 charge and got more.
                    let charges = activity.charges;
                    let isStartingWithZero = false;

                    if (charges === 0) {
                        isStartingWithZero = true;
                        charges = 1;
                    }

                    charges = applyEffectsToValue(
                        charges,
                        { absoluteEffects, relativeEffects },
                    ).result;

                    if (isStartingWithZero && charges === 1) {
                        return 0;
                    } else {
                        return charges;
                    }
                });
            },
            { store: activity.effectiveMaxChargesByCreature$$, objKey: creature },
        );
    }

    /**
     * Creates an observable for the effective cooldown for this activity and this creature,
     * then saves it on the activity for later use and returns it.
     * If the observable exists on the activity already, just returns it.
     */
    public effectiveCooldown$$(activity: Activity, { creature }: { creature: Creature }): Signal<number> {
        return weaklyCachedSignal(
            () => {
                const absoluteEffects$$ =
                    // Use absoluteEffectsOnThese$() because it allows to prefer lower values.
                    this._creatureEffectsService.absoluteEffectsOnThese$$(
                        creature,
                        [`${ activity.name } Cooldown`],
                        { lowerIsBetter: true },
                    );
                const relativeEffects$$ =
                    // Use relativeEffectsOnThese$() because it allows to prefer lower values.
                    this._creatureEffectsService.relativeEffectsOnThese$$(
                        creature,
                        [`${ activity.name } Cooldown`],
                        { lowerIsBetter: true },
                    );

                return computed(() => {
                    const absoluteEffects = absoluteEffects$$();
                    const relativeEffects = relativeEffects$$();

                    // Add any effects to the activity's cooldown.
                    // Less cooldown is better, so the effects are sorted in descending value.
                    return applyEffectsToValue(
                        activity.cooldown,
                        {
                            absoluteEffects: absoluteEffects
                                .sort((a, b) => b.setValueNumerical - a.setValueNumerical),
                            relativeEffects: relativeEffects
                                .sort((a, b) => b.valueNumerical - a.valueNumerical),
                        },
                    ).result;
                });
            },
            { store: activity.effectiveCooldownByCreature$$, objKey: creature },
        );
    }

    public heightenedText(activity: Activity, text: string, levelNumber: number): string {
        // For an arbitrary text (usually the activity description or the saving throw result descriptions),
        // retrieve the appropriate description set for this level and replace the variables with the included strings.
        let heightenedText = text;

        this._effectiveDescriptionSet(activity, levelNumber).descs.forEach((descVar: HeightenedDescriptionVariable) => {
            const regex = new RegExp(descVar.variable, 'g');

            heightenedText = heightenedText.replace(regex, (descVar.value || ''));
        });

        return heightenedText;
    }

    private _effectiveDescriptionSet(activity: Activity, levelNumber: number): HeightenedDescriptionVariableCollection {
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

        return new HeightenedDescriptionVariableCollection();
    }

}
