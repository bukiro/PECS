import { Injectable } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Creature } from 'src/app/classes/Creature';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { combineLatest, map, Observable, of, switchMap, tap } from 'rxjs';
import { AbsoluteEffect, RelativeEffect } from 'src/app/classes/Effect';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { ConditionPropertiesService } from '../condition-properties/condition-properties.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsDataService } from '../data/conditions-data.service';
import { Condition } from 'src/app/classes/Condition';

@Injectable({
    providedIn: 'root',
})
export class SpellPropertiesService {

    constructor(
        private readonly _skillValuesService: SkillValuesService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _conditionsDataService: ConditionsDataService,
    ) { }

    public dynamicSpellLevel$(casting: SpellCasting, choice: SpellChoice): Observable<number> {
        //To-Do: This needs to be eval-less and async.
        // For now, we figure out which skills are going to be needed and get them before the eval.
        // Do check if this actually works once the app compiles again.
        const regex = /Skill_Level\('(.+?)'\)/gm;
        const requiredSkillLevels: Array<string> = [];

        regex.exec(choice.dynamicAvailable)?.forEach(match => {
            requiredSkillLevels.push(match[1]);
        });

        return combineLatest([
            CharacterFlatteningService.characterLevel$,
            combineLatest(requiredSkillLevels
                .map(name => this._skillValuesService.level$(name, CreatureService.character)
                    .pipe(
                        map(skillLevel => ({ name, skillLevel })),
                    )),
            ),
        ])
            .pipe(
                map(([characterLevel, skillLevels]) => {
                    /* eslint-disable @typescript-eslint/no-unused-vars */
                    /* eslint-disable @typescript-eslint/naming-convention */
                    const Character = CreatureService.character;

                    // For now, this workaround allows us to check skill levels even though that's an async process.
                    const Skill_Level = (name: string): number =>
                        skillLevels.find(skill => skill.name === name)?.skillLevel ?? 0;

                    // Get the available spell level of this casting.
                    // This is the highest spell level of the spell choices that are
                    // available at your character level (and don't have a dynamic level).
                    //highestSpellLevel is used in the eval() process.
                    let highestSpellLevel = 1;

                    highestSpellLevel = Math.max(
                        ...casting.spellChoices
                            .filter(spellChoice => spellChoice.charLevelAvailable <= characterLevel)
                            .map(spellChoice => spellChoice.level),
                    );

                    /* eslint-enable @typescript-eslint/no-unused-vars */
                    /* eslint-enable @typescript-eslint/naming-convention */
                    try {
                        // eslint-disable-next-line no-eval
                        const level = parseInt(eval(choice.dynamicLevel), 10);

                        return level;
                    } catch (e) {
                        console.error(`Error parsing dynamic spell level (${ choice.dynamicLevel }): ${ e }`);

                        return 1;
                    }
                }),
            );
    }

    public effectiveSpellLevel$(
        spell: Spell,
        context: { baseLevel: number; creature: Creature; gain: SpellGain },
        options: { noEffects?: boolean } = {},
    ): Observable<number> {
        let level = context.baseLevel;

        const effectTargets = [
            'Spell Levels',
            `${ spell.name } Spell Level`,
        ];

        if (spell.traditions.includes(SpellTraditions.Focus)) {
            effectTargets.push('Focus Spell Levels');
        }

        if (spell.traits.includes('Cantrip')) {
            effectTargets.push('Cantrip Spell Levels');
        }

        return combineLatest([
            CreatureService.character$
                .pipe(
                    switchMap(character => character.maxSpellLevel$),
                ),
            options.noEffects
                ? combineLatest([
                    of(new Array<AbsoluteEffect>()),
                    of(new Array<RelativeEffect>()),
                ])
                : combineLatest([
                    this._creatureEffectsService.absoluteEffectsOnThese$(context.creature, effectTargets),
                    this._creatureEffectsService.relativeEffectsOnThese$(context.creature, effectTargets),
                ]),
        ])
            .pipe(
                map(([maxSpellLevel, [absolutes, relatives]]) => {
                    //If needed, calculate the dynamic effective spell level.
                    if (context.gain.dynamicEffectiveSpellLevel) {
                        try {
                            //TO-DO: replace eval with system similar to featrequirements
                            // eslint-disable-next-line no-eval
                            level = parseInt(eval(context.gain.dynamicEffectiveSpellLevel), 10);
                        } catch (e) {
                            console.error(`Error parsing effective spell level (${ context.gain.dynamicEffectiveSpellLevel }): ${ e }`);
                        }
                    }

                    //Focus spells and cantrips are automatically heightened to your maximum available spell level.
                    if ([0, -1].includes(level)) {
                        level = maxSpellLevel;
                    }

                    absolutes
                        .forEach(effect => {
                            if (effect.setValueNumerical > 0) {
                                level = effect.setValueNumerical;
                            }
                        });
                    relatives
                        .forEach(effect => {
                            if (effect.valueNumerical) {
                                level += effect.valueNumerical;
                            }
                        });

                    //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
                    return Math.max(level, (spell.levelreq || 0));
                }),
            );
    }

    public spellLevelFromBaseLevel$(spell: Spell, baseLevel: number): Observable<number> {
        return CreatureService.character.maxSpellLevel$
            .pipe(
                map(maxSpellLevel => {
                    let levelNumber = baseLevel;

                    if ((!levelNumber && (spell.traits.includes('Cantrip'))) || levelNumber === -1) {
                        levelNumber = maxSpellLevel;
                    }

                    levelNumber = Math.max(levelNumber, (spell.levelreq || 0));

                    return levelNumber;
                }),
            );
    }

    public spellConditionsForComponent$(
        spell: Spell,
        levelNumber: number,
        effectChoices: Array<{ condition: string; choice: string }>,
    ): Observable<Array<{ conditionGain: ConditionGain; condition: Condition; choices: Array<string>; show: boolean }>> {
        // For all conditions that are included with this spell on this level,
        // create an effectChoice on the gain and set it to the default choice, if any.
        // Keep those that are already configured.
        // Return a list of sets that contains the gain, the condition,
        // the choices and whether they should be shown to the user for selection.

        return of(spell.heightenedConditions(levelNumber))
            .pipe(
                switchMap(conditionGains =>
                    combineLatest(
                        conditionGains
                            .map(conditionGain => ({
                                conditionGain,
                                condition: this._conditionsDataService.conditionFromName(conditionGain.name),
                            }))
                            .map(({ conditionGain, condition }, index) =>
                                this._conditionPropertiesService.effectiveChoices$(condition, levelNumber)
                                    .pipe(
                                        // If the gain doesn't have a choice at that index
                                        // or the choice isn't among the condition's choices,
                                        // insert or replace that choice on the gain.
                                        tap(choices => {
                                            if (
                                                condition &&
                                                (
                                                    !effectChoices[index]
                                                    || !choices.includes(effectChoices[index].choice)
                                                )
                                            ) {
                                                effectChoices[index] =
                                                    { condition: condition.name, choice: condition.choice };
                                            }
                                        }),
                                        map(choices => ({
                                            conditionGain,
                                            condition,
                                            choices,
                                            show: (
                                                !!condition
                                                && !!choices.length
                                                && !conditionGain.choiceBySubType
                                                && !conditionGain.choiceLocked
                                                && !conditionGain.copyChoiceFrom
                                                && !conditionGain.hideChoices
                                            ),
                                        })),
                                    ),
                            ),
                    ),
                ),
            );
    }

}
