import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Familiar } from 'src/app/classes/Familiar';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { FamiliarsDataService } from '../data/familiars-data.service';

@Injectable({
    providedIn: 'root',
})
export class ConditionPropertiesService {

    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public isConditionInformational(
        creature: Creature,
        condition: Condition,
        conditionGain?: ConditionGain,
    ): boolean {
        //Return whether the condition has any effects beyond showing text, and if it causes or overrides any currently existing conditions.
        return !(
            !!condition.effects?.length ||
            !!condition.endConditions.length ||
            !!condition.gainItems.length ||
            !!condition.gainActivities.length ||
            !!condition.senses.length ||
            !!condition.nextCondition.length ||
            !!condition.endEffects.length ||
            !!condition.denyConditions.length ||
            condition.isStoppingTime(conditionGain) ||
            (
                condition.hints.some(hint =>
                    hint.effects?.length &&
                    (
                        !conditionGain ||
                        !hint.conditionChoiceFilter.length ||
                        hint.conditionChoiceFilter.includes(conditionGain.choice)
                    ),
                )
            ) ||
            (
                condition.gainConditions.length ?
                    this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
                        .some(existingCondition => !conditionGain || existingCondition.parentID === conditionGain.id) :
                    false
            ) ||
            (
                condition.overrideConditions.length ?
                    this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
                        .some(existingCondition =>
                            condition.conditionOverrides(conditionGain).some(override =>
                                override.name === existingCondition.name &&
                                (
                                    !override.conditionChoiceFilter?.length ||
                                    override.conditionChoiceFilter.includes(conditionGain?.choice || '')
                                ),
                            ),
                        ) :
                    false
            ) ||
            (
                condition.pauseConditions.length ?
                    this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
                        .some(existingCondition =>
                            condition.conditionPauses(conditionGain).some(pause =>
                                pause.name === existingCondition.name &&
                                (
                                    !pause.conditionChoiceFilter?.length ||
                                    pause.conditionChoiceFilter.includes(conditionGain?.choice || '')
                                ),
                            ),
                        ) :
                    false
            )
        );
    }

    public cacheEffectiveChoices(
        condition: Condition,
        spellLevel: number = condition.minLevel,
    ): void {
        //If this.choice is not one of the available choices, set it to the first.
        if (condition.choices.length && !condition.choices.map(choice => choice.name).includes(condition.choice)) {
            condition.choice = condition.choices[0].name;
        }

        const choices: Array<string> = [];

        condition.choices.forEach(choice => {
            //The default choice is never tested. This ensures a fallback if no choices are available.
            if (choice.name === condition.choice) {
                choices.push(choice.name);
            } else {
                const character = CreatureService.character;

                //If the choice has a featreq, check if you meet that (or a feat that has this supertype).
                //Requirements like "Aggressive Block or Brutish Shove" are split in get_CharacterFeatsAndFeatures().
                if (!choice.spelllevelreq || spellLevel >= choice.spelllevelreq) {
                    let hasOneFeatreqFailed = false;

                    if (choice.featreq?.length) {

                        choice.featreq.forEach(featreq => {
                            //Allow to check for the Familiar's feats
                            let requiredFeat: Array<Feat>;
                            let testCreature: Character | Familiar;
                            let testFeat = featreq;

                            if (featreq.includes('Familiar:')) {
                                testCreature = CreatureService.familiar;
                                testFeat = featreq.split('Familiar:')[1].trim();
                                requiredFeat = this._familiarsDataService.familiarAbilities(testFeat);
                            } else {
                                testCreature = character;
                                requiredFeat = this._characterFeatsService.characterFeatsAndFeatures(testFeat, '', true);
                            }

                            if (
                                !requiredFeat.length ||
                                !requiredFeat.some(feat =>
                                    this._creatureFeatsService.creatureHasFeat(feat, { creature: testCreature }),
                                )
                            ) {
                                hasOneFeatreqFailed = true;
                            }
                        });

                        if (!hasOneFeatreqFailed) {
                            choices.push(choice.name);
                        }
                    } else {
                        choices.push(choice.name);
                    }
                }
            }
        });
        condition.$choices = choices;
    }

}
