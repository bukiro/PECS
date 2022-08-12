import { Injectable } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { CharacterService } from 'src/app/services/character.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Creature } from 'src/app/classes/Creature';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { EffectsService } from '../../../../app/services/effects.service';

@Injectable({
    providedIn: 'root',
})
export class SpellPropertiesService {

    constructor(
        private readonly _skillValuesService: SkillValuesService,
        private readonly _characterService: CharacterService,
        private readonly _effectsService: EffectsService,
    ) { }

    public dynamicSpellLevel(casting: SpellCasting, choice: SpellChoice): number {
        //highestSpellLevel is used in the eval() process.
        let highestSpellLevel = 1;
        const Character = this._characterService.character;

        /* eslint-disable @typescript-eslint/no-unused-vars */
        /* eslint-disable @typescript-eslint/naming-convention */
        const Skill_Level = (name: string): number =>
            this._skillValuesService.level(name, Character, Character.level);

        // Get the available spell level of this casting.
        // This is the highest spell level of the spell choices that are available at your character level (and don't have a dynamic level).
        highestSpellLevel = Math.max(
            ...casting.spellChoices
                .filter(spellChoice => spellChoice.charLevelAvailable <= Character.level)
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
    }

    public effectiveSpellLevel(
        spell: Spell,
        context: { baseLevel: number; creature: Creature; gain: SpellGain },
        options: { noEffects?: boolean } = {},
    ): number {
        //Focus spells are automatically heightened to your maximum available spell level.
        let level = context.baseLevel;

        //If needed, calculate the dynamic effective spell level.
        const Character = this._characterService.character;

        if (context.gain.dynamicEffectiveSpellLevel) {
            try {
                //TO-DO: replace eval with system similar to featrequirements
                // eslint-disable-next-line no-eval
                level = parseInt(eval(context.gain.dynamicEffectiveSpellLevel), 10);
            } catch (e) {
                console.error(`Error parsing effective spell level (${ context.gain.dynamicEffectiveSpellLevel }): ${ e }`);
            }
        }

        if ([0, -1].includes(level)) {
            level = Character.maxSpellLevel();
        }

        if (!options.noEffects) {
            //Apply all effects that might change the effective spell level of this spell.
            const list = [
                'Spell Levels',
                `${ spell.name } Spell Level`,
            ];

            if (spell.traditions.includes(SpellTraditions.Focus)) {
                list.push('Focus Spell Levels');
            }

            if (spell.traits.includes('Cantrip')) {
                list.push('Cantrip Spell Levels');
            }

            this._effectsService.absoluteEffectsOnThese(context.creature, list).forEach(effect => {
                if (parseInt(effect.setValue, 10)) {
                    level = parseInt(effect.setValue, 10);
                }
            });
            this._effectsService.relativeEffectsOnThese(context.creature, list).forEach(effect => {
                if (parseInt(effect.value, 10)) {
                    level += parseInt(effect.value, 10);
                }
            });
        }

        //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
        return Math.max(level, (spell.levelreq || 0));
    }

}
