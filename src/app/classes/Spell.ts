import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { SpellGain } from './SpellGain';
import { heightenedTextFromDescSets } from 'src/libs/shared/util/descriptionUtils';
import { SpellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';

export class Spell {
    public actions = '1A';
    public allowReturnFocusPoint = false;
    public area = '';
    public castType = '';
    public cost = '';
    public critfailure = '';
    public critsuccess = '';
    public heightenedDescs: Array<HeightenedDescSet> = [];
    public desc = '';
    /** desc2 is displayed after the success levels. */
    public desc2 = '';
    public duration = '';
    /**
     * When giving conditions to other player creatures,
     * they should last half a round longer to allow for the caster's turn to end after their last.
     * Spells with a duration like "until the end of the target's turn" instead give the caster half a turn longer.
     * This is activated by durationDependsOnTarget.
     */
    public durationDependsOnTarget = false;
    public failure = '';
    public gainConditions: Array<ConditionGain> = [];
    public gainItems: Array<ItemGain> = [];
    public heightened: Array<{ desc: string; level: string }> = [];
    public id = '';
    public inputRequired = '';
    public levelreq = 1;
    public name = '';
    /**
     * overrideHostile allows you to declare a spell as hostile or friendly regardless of other indicators.
     * This will only change the display color of the spell, but not whether you can target allies.
     */
    public overrideHostile: 'hostile' | 'friendly' | '' = '';
    public PFSnote = '';
    public range = '';
    public savingThrow = '';
    public shortDesc = '';
    public showSpells: Array<SpellCast> = [];
    public sourceBook = '';
    public success = '';
    /** Sustained spells are deactivated after this time (or permanent with -1, or when resting with -2). */
    public sustained = 0;
    /**
     * target is used internally to determine whether you can cast this spell on yourself, your companion/familiar or any ally
     * Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
     * For "companion", it can only be cast on the companion
     * For "familiar", it can only be cast on the familiar
     * For "self", the spell button will say "Cast", and you are the target
     * For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
     * For "area", it can be cast on any in-app creature witout target number limit or without target
     * For "object", "minion" or "other", the spell button will just say "Cast" without a target
     * Any non-hostile spell can still target allies if the target number is nonzero.
     * Hostile spells can target allies if the target number is nonzero and this.overrideHostile is "friendly".
     */
    public target = 'self';
    /** The target description in the spell description. */
    public targets = '';
    /**
     * If cannotTargetCaster is set, you can't cast the spell on yourself,
     * and you can't select yourself as one of the targets of an ally or area spell.
     * This is needed for emanations (where the spell should give the caster the correct condition in the first place)
     * and spells that exclusively target a different creature
     * (in case of "you and [...]", the caster condition should take care of the caster's part.).
     */
    public cannotTargetCaster = false;
    public singleTarget = false;
    public traditions: Array<string> = [];
    public traits: Array<string> = [];
    public trigger = '';
    public requirements = '';
    /**
     * The target number determines how many allies you can target with a non-hostile activity,
     * or how many enemies you can target with a hostile one (not actually implemented).
     * The spell can have multiple target numbers that are dependent on the character level and whether you have a feat.
     */
    public targetNumbers: Array<SpellTargetNumber> = [];
    public recast(): Spell {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainConditions.forEach(conditionGain => {
            conditionGain.source = this.name;
        });
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.showSpells = this.showSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.targetNumbers = this.targetNumbers.map(obj => Object.assign(new SpellTargetNumber(), obj).recast());

        return this;
    }
    public activationTraits(): Array<string> {
        return Array.from(new Set([].concat(...this.castType.split(',')
            .map(castType => {
                const trimmedType = castType.trim().toLowerCase();

                if (trimmedType.includes('verbal')) {
                    return ['Concentrate'];
                } else if (trimmedType.includes('material')) {
                    return ['Manipulate'];
                } else if (trimmedType.includes('somatic')) {
                    return ['Manipulate'];
                } else if (trimmedType.includes('focus')) {
                    return ['Manipulate'];
                } else {
                    return [];
                }
            }),
        )));
    }
    public heightenedText(text: string, levelNumber: number): string {
        return heightenedTextFromDescSets(text, levelNumber, this.heightenedDescs);
    }
    public allowedTargetNumber(levelNumber: number, characterService: CharacterService): number {
        //You can select any number of targets for an area spell.
        if (this.target === 'area') {
            return -1;
        }

        const character = characterService.character();
        let resultingTargetNumber: SpellTargetNumber;

        // This descends from levelnumber downwards and returns the first available targetNumber that has the required feat (if any).
        // Prefer targetNumbers with required feats over those without.
        // If no targetNumbers are configured, return 1 for an ally spell and 0 for any other, and if none have a minLevel,
        // return the first that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        if (this.targetNumbers.length) {
            if (this.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
                let remainingLevelNumber = levelNumber;

                for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                    if (this.targetNumbers.some(targetNumber => targetNumber.minLevel === remainingLevelNumber)) {
                        resultingTargetNumber = this.targetNumbers.find(targetNumber =>
                            (targetNumber.minLevel === remainingLevelNumber) &&
                            (
                                targetNumber.featreq &&
                                !!characterService.characterFeatsTaken(1, character.level, { featName: targetNumber.featreq }).length
                            ),
                        );

                        if (!resultingTargetNumber) {
                            resultingTargetNumber = this.targetNumbers.find(targetNumber => targetNumber.minLevel === remainingLevelNumber);
                        }

                        if (resultingTargetNumber) {
                            return resultingTargetNumber.number;
                        }
                    }
                }

                return this.targetNumbers[0].number;
            } else {
                resultingTargetNumber = this.targetNumbers.find(targetNumber =>
                    targetNumber.featreq &&
                    !!characterService.characterFeatsTaken(1, character.level, { featName: targetNumber.featreq }).length,
                );

                return resultingTargetNumber?.number || this.targetNumbers[0].number;
            }
        } else {
            if (this.target === 'ally') {
                return 1;
            } else {
                return 0;
            }
        }
    }
    public heightenedConditions(levelNumber: number = this.levelreq): Array<ConditionGain> {
        // This descends through the level numbers, starting with levelNumber
        // and returning the first set of ConditionGains found with a matching heightenedfilter.
        // If a heightenedFilter is found, the unheightened ConditionGains are returned as well.
        // If there are no ConditionGains with a heightenedFilter, return all.
        if (!this.gainConditions.length || !this.gainConditions.some(gain => gain.heightenedFilter)) {
            return this.gainConditions;
        } else if (this.gainConditions.length) {
            for (let remainingLevelNumber = levelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                if (this.gainConditions.some(gain => gain.heightenedFilter === remainingLevelNumber)) {
                    return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter === remainingLevelNumber);
                }
            }

            //The spell level might be too low for any of the existing ConditionGains with a heightenedFilter.
            // Return all conditions without a filter in that case.
            return this.gainConditions.filter(gain => !gain.heightenedFilter);
        }
    }
    public meetsLevelReq(
        characterService: CharacterService,
        spellLevel: number = SpellLevelFromCharLevel(characterService.character().level),
    ): { met: boolean; desc: string } {
        //If the spell has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: { met: boolean; desc: string };

        if (this.levelreq && !this.traits.includes('Cantrip')) {
            if (spellLevel >= this.levelreq) {
                result = { met: true, desc: `Level ${ this.levelreq }` };
            } else {
                result = { met: false, desc: `Level ${ this.levelreq }` };
            }
        } else {
            result = { met: true, desc: '' };
        }

        return result;
    }
    public canChoose(
        characterService: CharacterService,
        spellLevel: number = SpellLevelFromCharLevel(characterService.character().level),
    ): boolean {
        if (characterService.stillLoading()) { return false; }

        if (spellLevel === -1) {
            spellLevel = SpellLevelFromCharLevel(characterService.character().level);
        }

        const isLevelreqMet = this.meetsLevelReq(characterService, spellLevel).met;

        return isLevelreqMet;
    }
    public isHostile(ignoreOverride = false): boolean {
        // Return whether a spell is meant to be cast on enemies.
        // This is usually the case if the spell target is "other", or if the target is "area" and the spell has no target conditions.
        // Use ignoreOverride to determine whether you can target allies with a spell that is shown as hostile using overideHostile.
        return (
            //If ignoreOverride is false and this spell is overrideHostile as hostile, the spell counts as hostile.
            (!ignoreOverride && this.overrideHostile === 'hostile') ||
            //Otherwise, as long as overrides are ignored or no override as friendly exists, keep checking.
            (
                (
                    ignoreOverride ||
                    this.overrideHostile !== 'friendly'
                ) &&
                (
                    this.target === 'other' ||
                    (
                        this.target === 'area' && !this.hasTargetConditions()
                    )
                )
            )
        );
    }
    public hasTargetConditions(): boolean {
        return this.gainConditions.some(gain => gain.targetFilter !== 'caster');
    }
    public effectiveSpellLevel(
        context: { baseLevel: number; creature: Creature; gain: SpellGain },
        services: { characterService: CharacterService; effectsService: EffectsService },
        options: { noEffects?: boolean } = {},
    ): number {
        //Focus spells are automatically heightened to your maximum available spell level.
        let level = context.baseLevel;

        //If needed, calculate the dynamic effective spell level.
        const Character = services.characterService.character();

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
                `${ this.name } Spell Level`,
            ];

            if (this.traditions.includes('Focus')) {
                list.push('Focus Spell Levels');
            }

            if (this.traits.includes('Cantrip')) {
                list.push('Cantrip Spell Levels');
            }

            services.effectsService.get_AbsolutesOnThese(context.creature, list).forEach(effect => {
                if (parseInt(effect.setValue, 10)) {
                    level = parseInt(effect.setValue, 10);
                }
            });
            services.effectsService.get_RelativesOnThese(context.creature, list).forEach(effect => {
                if (parseInt(effect.value, 10)) {
                    level += parseInt(effect.value, 10);
                }
            });
        }

        //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
        return Math.max(level, (this.levelreq || 0));
    }
}
