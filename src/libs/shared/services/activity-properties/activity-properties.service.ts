import { Injectable } from '@angular/core';
import { Observable, of, combineLatest, map, shareReplay } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityTargetOption } from 'src/app/classes/activities/activity-target-options';
import { Creature } from 'src/app/classes/creatures/creature';
import { HeightenedDescriptionVariableCollection } from 'src/app/classes/spells/heightened-description-variable-collection';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellTargetNumber } from 'src/app/classes/spells/spell-target-number';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { HeightenedDescriptionVariable } from 'src/app/classes/spells/heightened-description-variable';
import { emptySafeCombineLatest } from '../../util/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class ActivityPropertiesService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public allowedTargetNumber$(activity: Activity | Spell, levelNumber: number): Observable<number> {
        //You can select any number of targets for an area spell.
        if (activity.target === ActivityTargetOption.Area) {
            return of(-1);
        }

        // This descends from levelnumber downwards and returns the first available targetNumber
        //  that has the required feat or requires no feat,
        //  preferring targetNumbers with required feats over those without.
        // If no targetNumbers are configured, return 1 for an ally activity and 0 for any other, and if none have a minLevel,
        // return the first that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        if (activity.targetNumbers.length) {
            if (activity.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
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
                return emptySafeCombineLatest(
                    targetNumbersWithFeatreq
                        .map(targetNumber =>
                            this._characterFeatsService.characterHasFeatAtLevel$(targetNumber.featreq)
                                .pipe(
                                    map(hasRequiredFeat => ({ targetNumber, hasRequiredFeat })),
                                ),
                        ),
                )
                    .pipe(
                        map(targetNumberWithFeatReqSets => {
                            const matchingTargetNumber =
                                targetNumberWithFeatReqSets
                                    .find(targetNumberSet => targetNumberSet.hasRequiredFeat)?.targetNumber;

                            return matchingTargetNumber?.number
                                || firstTargetNumberWithoutFeatreq?.number
                                || activity.targetNumbers[0]?.number
                                || 0;
                        }),
                    );
            } else {
                return emptySafeCombineLatest(
                    activity.targetNumbers
                        .filter(targetNumber => targetNumber.featreq)
                        .map(targetNumber =>
                            this._characterFeatsService.characterHasFeatAtLevel$(targetNumber.featreq)
                                .pipe(
                                    map(hasRequiredFeat => ({ targetNumber, hasRequiredFeat })),
                                ),
                        ),
                )
                    .pipe(
                        map(targetNumberWithFeatReqSets => {
                            const matchingTargetNumber =
                                targetNumberWithFeatReqSets
                                    .find(targetNumberSet => targetNumberSet.hasRequiredFeat)?.targetNumber;

                            return matchingTargetNumber?.number
                            || activity.targetNumbers[0]?.number
                            || 0;
                        }),
                    );
            }
        } else {
            if (activity.target === ActivityTargetOption.Ally) {
                return of(1);
            } else {
                return of(0);
            }
        }
    }

    /**
     * Creates an observable for the effective cooldown for this activity and this creature,
     * then saves it on the activity for later use and returns it.
     * If the observable exists on the activity already, just returns it.
     */
    public effectiveMaxCharges$(activity: Activity, context: { creature: Creature }): Observable<number> {
        if (!activity.effectiveMaxChargesByCreature$.get(context.creature.id)) {
            activity.effectiveMaxChargesByCreature$.set(
                context.creature.id,
                combineLatest([
                    this._creatureEffectsService.absoluteEffectsOnThis$(context.creature, `${ activity.name } Charges`),
                    this._creatureEffectsService.relativeEffectsOnThis$(context.creature, `${ activity.name } Charges`),
                ])
                    .pipe(
                        map(([absolutes, relatives]) => {
                            // Add any effects to the number of charges you have.
                            // If you have none, start with 1, and if the result then remains 1, go back to 0.
                            // This is to ensure an activity that has no charges
                            //  and gets more charges is treated like an activity that had 1 charge.
                            let charges = activity.charges;
                            let isStartingWithZero = false;

                            if (charges === 0) {
                                isStartingWithZero = true;
                                charges = 1;
                            }

                            absolutes
                                .forEach(effect => {
                                    charges = effect.setValueNumerical;
                                });

                            relatives
                                .forEach(effect => {
                                    charges += effect.valueNumerical;
                                });

                            if (isStartingWithZero && charges === 1) {
                                return 0;
                            } else {
                                return charges;
                            }
                        }),
                        shareReplay({ refCount: true, bufferSize: 1 }),
                    ),
            );
        }

        return activity.effectiveMaxChargesByCreature$.get(context.creature.id)
            // This fallback can never happen, but is needed for code safety.
            ?? of(activity.charges);
    }

    /**
     * Creates an observable for the effective cooldown for this activity and this creature,
     * then saves it on the activity for later use and returns it.
     * If the observable exists on the activity already, just returns it.
     */
    public effectiveCooldown$(activity: Activity, context: { creature: Creature }): Observable<number> {
        if (!activity.effectiveCooldownByCreature$.get(context.creature.id)) {
            activity.effectiveCooldownByCreature$.set(
                context.creature.id,
                combineLatest([
                    //Use get_AbsolutesOnThese() because it allows to prefer lower values. We still sort the effects in descending setValue.
                    this._creatureEffectsService.absoluteEffectsOnThese$(
                        context.creature,
                        [`${ activity.name } Cooldown`],
                        { lowerIsBetter: true },
                    ),
                    //Use get_RelativesOnThese() because it allows to prefer lower values. We still sort the effects in descending value.
                    this._creatureEffectsService.relativeEffectsOnThese$(
                        context.creature,
                        [`${ activity.name } Cooldown`],
                        { lowerIsBetter: true },
                    ),
                ])
                    .pipe(
                        map(([absolutes, relatives]) => {
                            //Add any effects to the activity's cooldown.
                            let cooldown = activity.cooldown;

                            absolutes
                                .sort((a, b) => parseInt(b.setValue, 10) - parseInt(a.setValue, 10))
                                .forEach(effect => {
                                    cooldown = effect.setValueNumerical;
                                });

                            relatives
                                .sort((a, b) => parseInt(b.value, 10) - parseInt(a.value, 10))
                                .forEach(effect => {
                                    cooldown += effect.valueNumerical;
                                });

                            return cooldown;
                        }),
                        shareReplay({ refCount: true, bufferSize: 1 }),
                    ),
            );
        }

        return activity.effectiveCooldownByCreature$.get(context.creature.id)
            // This fallback can never happen, but is needed for code safety.
            ?? of(activity.cooldown);
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
