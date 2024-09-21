/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { tap, take } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { CreatureTypes } from '../../definitions/creature-types';
import { ArmorClassService, CoverTypes } from '../armor-class/armor-class.service';
import { CreatureService } from '../creature/creature.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { HealthService } from '../health/health.service';
import { SpellCastingPrerequisitesService } from '../spell-casting-prerequisites/spell-casting-prerequisites.service';
import { emptySafeZip } from '../../util/observable-utils';
import { TemporaryHP } from 'src/app/classes/creatures/temporary-hp';

interface PreparedOnceEffect {
    creatureType: CreatureTypes;
    effectGain: EffectGain;
    conditionValue: number;
    conditionHeightened: number;
    conditionChoice: string;
    conditionSpellCastingAbility: string;
}

interface EffectRecipientPhrases {
    name: string;
    pronounCap: string;
    pronoun: string;
    pronounGenitive: string;
    verbIs: string;
    verbHas: string;
}

@Injectable({
    providedIn: 'root',
})
export class OnceEffectsService {

    private readonly _preparedOnceEffects: Array<PreparedOnceEffect> = [];
    private _evaluationService?: EvaluationService;

    constructor(
        private readonly _toastService: ToastService,
        private readonly _armorClassService: ArmorClassService,
        private readonly _healthService: HealthService,
        private readonly _spellCastingPrerequisitesService: SpellCastingPrerequisitesService,
    ) { }

    public prepareOnceEffect(
        creature: Creature,
        effectGain: EffectGain,
        conditionValue = 0,
        conditionHeightened = 0,
        conditionChoice = '',
        conditionSpellCastingAbility = '',
    ): void {
        this._preparedOnceEffects.push({
            creatureType: creature.type,
            effectGain,
            conditionValue,
            conditionHeightened,
            conditionChoice,
            conditionSpellCastingAbility,
        });
    }

    public processPreparedOnceEffects(): void {
        // Make a copy of the prepared OnceEffects and clear the original.
        // Some OnceEffects can cause effects to be regenerated, which calls this function again,
        // so we need to clear them to avoid duplicate applications.
        const preparedOnceEffects = this._preparedOnceEffects.slice();

        this._preparedOnceEffects.length = 0;

        emptySafeZip(
            preparedOnceEffects.map(prepared =>
                CreatureService.creatureFromType$(prepared.creatureType)
                    .pipe(
                        tap(creature => {
                            this.processOnceEffect(
                                creature,
                                prepared.effectGain,
                                prepared.conditionValue,
                                prepared.conditionHeightened,
                                prepared.conditionChoice,
                                prepared.conditionSpellCastingAbility,
                            );
                        }),
                    ),
            ))
            .pipe(
                take(1),
            )
            .subscribe();
    }

    public processOnceEffect(
        creature: Creature,
        effectGain: EffectGain,
        conditionValue = 0,
        conditionHeightened = 0,
        conditionChoice = '',
        conditionSpellCastingAbility = '',
    ): void {
        let value = 0;

        try {
            // We eval the effect value by sending it to the evaluationService
            // with some additional attributes and receive the resulting effect.
            if (effectGain.value) {
                const testObject = {
                    spellSource: effectGain.spellSource,
                    value: conditionValue,
                    heightened: conditionHeightened,
                    choice: conditionChoice,
                    spellCastingAbility: conditionSpellCastingAbility,
                };

                if (!this._evaluationService) { console.error('EvaluationService missing in OnceEffectService!'); }

                const validationResult =
                    this._evaluationService?.valueFromFormula$(
                        effectGain.value,
                        { creature, object: testObject, effect: effectGain },
                    );

                if (validationResult && typeof validationResult === 'number') {
                    value = validationResult;
                }
            }
        } catch (error) {
            value = 0;
        }

        const phrases = {
            name: '',
            pronounCap: 'It',
            pronoun: 'it',
            pronounGenitive: 'its',
            verbIs: 'is',
            verbHas: 'is',
        };

        if (creature.isCharacter()) {
            phrases.name = 'You';
            phrases.pronounCap = 'You';
            phrases.pronoun = 'you';
            phrases.pronounGenitive = 'your';
            phrases.verbIs = 'are';
            phrases.verbHas = 'have';
        } else if (creature.isAnimalCompanion()) {
            phrases.name = creature.name || 'Your animal companion';
        } else if (creature.isFamiliar()) {
            phrases.name = creature.name || 'Your familiar';
        }

        switch (effectGain.affected) {
            case 'Focus Points':
                this._changeCharacterFocusPointsWithNotification(value);

                break;
            case 'Temporary HP':
                this._changeCreatureTemporaryHPWithNotification(
                    creature,
                    value,
                    { source: effectGain.source, sourceId: effectGain.sourceId },
                );

                break;
            case 'HP':
                this._changeCreatureHPWithNotification(creature, value, { source: effectGain.source });

                break;
            case 'Raise Shield': {
                this._raiseCharacterShieldWithNotification(value);

                break;
            }
            case 'Cover':
                this._changeCreatureCoverWithNotification(creature, value);

                break;
            default: break;
        }
    }

    public initialize(evaluationService: EvaluationService): void {
        this._evaluationService = evaluationService;
    }

    private _effectRecipientPhrases(creature: Creature): EffectRecipientPhrases {
        const phrases = {
            name: '',
            pronounCap: 'It',
            pronoun: 'it',
            pronounGenitive: 'its',
            verbIs: 'is',
            verbHas: 'is',
        };

        if (creature.isCharacter()) {
            phrases.name = 'You';
            phrases.pronounCap = 'You';
            phrases.pronoun = 'you';
            phrases.pronounGenitive = 'your';
            phrases.verbIs = 'are';
            phrases.verbHas = 'have';
        } else if (creature.isAnimalCompanion()) {
            phrases.name = creature.name || 'Your animal companion';
        } else if (creature.isFamiliar()) {
            phrases.name = creature.name || 'Your familiar';
        }

        return phrases;
    }

    private _changeCharacterFocusPointsWithNotification(value: number): void {
        this._spellCastingPrerequisitesService.maxFocusPoints$
            .pipe(
                take(1),
            )
            .subscribe(maxFocusPoints => {
                const character = CreatureService.character;

                if (maxFocusPoints === 0) {
                    this._toastService.show('Your focus points were not changed because you don\'t have a focus pool.');

                    return;
                }

                character.class.focusPoints = Math.min(character.class.focusPoints, maxFocusPoints);
                // We intentionally add the point after we set the limit.
                // This allows us to gain focus points with feats and raise the current points
                // before the limit is increased. The focus points are automatically limited in the spellbook component,
                // where they are displayed, and when casting focus spells.
                character.class.focusPoints += value;

                if (value >= 0) {
                    this._toastService.show(`You gained ${ value } focus point${ value === 1 ? '' : 's' }.`);
                } else {
                    this._toastService.show(`You lost ${ value * -1 } focus point${ value === 1 ? '' : 's' }.`);
                }
            });
    }

    private _changeCreatureTemporaryHPWithNotification(
        creature: Creature,
        value: number,
        context: { source: string; sourceId: string },
    ): void {
        const phrases = this._effectRecipientPhrases(creature);

        // When you get temporary HP, some things to process:
        // - If you already have temporary HP, add this amount to the selection.
        //   The player needs to choose one amount; they are not cumulative.
        // - If you are setting temporary HP manually, or if the current amount is 0,
        //   skip the selection and remove all the other options.
        // - If you are losing temporary HP, lose only those that come from the same source.
        // -- If that's the current effective amount, remove all other options
        //    (if you are "using" your effective temporary HP, we assume that you have made the choice for this amount).
        // --- If the current amount is 0 after loss, reset the temporary HP.
        // -- Remove it if it's not the effective amount.
        if (value > 0) {
            if (context.source === 'Manual') {
                creature.health.temporaryHP = [TemporaryHP.from({ amount: value, source: context.source, sourceId: '' })];
                this._toastService.show(`${ phrases.name } gained ${ value } temporary HP.`);
            } else if (creature.health.mainTemporaryHP.amount === 0) {
                creature.health.temporaryHP = [TemporaryHP.from({ amount: value, source: context.source, sourceId: context.sourceId })];
                this._toastService.show(`${ phrases.name } gained ${ value } temporary HP from ${ context.source }.`);
            } else {
                creature.health.temporaryHP.push(TemporaryHP.from({ amount: value, source: context.source, sourceId: context.sourceId }));
                this._toastService.show(
                    `${ phrases.name } gained ${ value } temporary HP from ${ context.source }. `
                    + `${ phrases.name } already had temporary HP and must choose which amount to keep.`,
                );
            }
        } else if (value < 0) {
            const targetTempHPSet =
                creature.health.temporaryHP
                    .find(tempHPSet =>
                        ((tempHPSet.source === 'Manual') && (context.source === 'Manual')) ||
                        tempHPSet.sourceId === context.sourceId,
                    );

            if (targetTempHPSet) {
                targetTempHPSet.amount += value;

                // If this is the main temporary HP set, register it as the only set as you have started to use it.
                if (targetTempHPSet === creature.health.mainTemporaryHP) {
                    creature.health.temporaryHP.length = 1;

                    // If its amount is reduced to 0, remove it entirely.
                    if (targetTempHPSet.amount <= 0) {
                        creature.health.temporaryHP.length = 0;
                    }

                    this._toastService.show(`${ phrases.name } lost ${ value * -1 } temporary HP.`);
                } else {
                    if (targetTempHPSet.amount <= 0) {
                        creature.health.temporaryHP.splice(creature.health.temporaryHP.indexOf(targetTempHPSet), 1);
                    }

                    this._toastService.show(
                        `${ phrases.name } lost ${ value * -1 } of the temporary HP gained from ${ context.source }. `
                        + `This is not the set of temporary HP that ${ phrases.pronoun } ${ phrases.verbIs } currently using.`,
                    );
                }
            }
        }
    }

    private _changeCreatureHPWithNotification(creature: Creature, value: number, context: { source: string }): void {
        const phrases = this._effectRecipientPhrases(creature);

        if (value > 0) {
            const { hasRemovedUnconscious, hasRemovedDying } = this._healthService.heal(creature, value, true);
            let results = '';

            if (hasRemovedUnconscious) {
                results = ` This removed ${ phrases.pronounGenitive } Unconscious condition.`;
            }

            if (hasRemovedDying) {
                results = ` This removed ${ phrases.pronounGenitive } Dying condition.`;
            }

            this._toastService.show(`${ phrases.name } gained ${ value } HP from ${ context.source }.${ results }`);
        } else if (value < 0) {
            this._healthService.takeDamage$(creature, -value)
                .then(({ hasAddedUnconscious, dyingAddedAmount, hasRemovedUnconscious }) => {
                    let results = '';

                    if (hasAddedUnconscious) {
                        results = ` ${ phrases.name } ${ phrases.verbIs } now Unconscious.`;
                    }

                    if (dyingAddedAmount && context.source !== 'Dead') {
                        results = ` ${ phrases.pronounCap } ${ phrases.verbIs } now Dying ${ dyingAddedAmount }.`;
                    }

                    if (hasRemovedUnconscious) {
                        results = ` This removed ${ phrases.pronounGenitive } Unconscious condition.`;
                    }

                    this._toastService.show(`${ phrases.name } lost ${ value * -1 } HP from ${ context.source }.${ results }`);
                });
        }
    }

    private _raiseCharacterShieldWithNotification(value: number): void {
        const equippedShield = CreatureService.character.mainInventory?.shields.find(shield => shield.equipped);

        if (equippedShield) {
            if (value > 0) {
                equippedShield.raised = true;
                this._toastService.show('Your shield was raised.');
            } else {
                equippedShield.raised = false;
                this._toastService.show('Your shield was lowered.');
            }
        }
    }

    private _changeCreatureCoverWithNotification(creature: Creature, value: number): void {
        const phrases = this._effectRecipientPhrases(creature);

        this._armorClassService.setCover(creature, value);

        switch (value) {
            case CoverTypes.NoCover:
                this._toastService.show(`${ phrases.name } ${ phrases.verbIs } no longer taking cover.`);
                break;
            case CoverTypes.LesserCover:
                this._toastService.show(`${ phrases.name } now ${ phrases.verbHas } lesser cover.`);
                break;
            case CoverTypes.Cover:
                this._toastService.show(`${ phrases.name } now ${ phrases.verbHas } standard cover.`);
                break;
            case CoverTypes.GreaterCover:
                this._toastService.show(`${ phrases.name } now ${ phrases.verbHas } greater cover.`);
                break;
            default: break;
        }
    }

}
