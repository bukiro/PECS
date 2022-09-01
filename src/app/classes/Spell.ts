import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { heightenedTextFromDescSets } from 'src/libs/shared/util/descriptionUtils';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { ActivityTargetOptions } from './Activity';

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
    public target: ActivityTargetOptions = ActivityTargetOptions.Self;
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
    public traditions: Array<SpellTraditions | ''> = [];
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

    public clone(): Spell {
        return Object.assign<Spell, Spell>(new Spell(), JSON.parse(JSON.stringify(this))).recast();
    }

    public activationTraits(): Array<string> {
        return Array.from(new Set(([] as Array<string>).concat(...this.castType.split(',')
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

    public heightenedConditions(levelNumber: number = this.levelreq): Array<ConditionGain> {
        // This descends through the level numbers, starting with levelNumber
        // and returning the first set of ConditionGains found with a matching heightenedfilter.
        // If a heightenedFilter is found, the unheightened ConditionGains are returned as well.
        // If there are no ConditionGains with a heightenedFilter, return all.
        if (!this.gainConditions.length || !this.gainConditions.some(gain => gain.heightenedFilter)) {
            return this.gainConditions;
        } else {
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
        spellLevel: number,
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
}
