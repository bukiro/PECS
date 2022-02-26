import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellCast } from 'src/app/classes/SpellCast';
import { EffectsService } from 'src/app/services/effects.service';
import { Creature } from 'src/app/classes/Creature';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { SpellGain } from './SpellGain';

export class Spell {
    public actions: string = "1A";
    public allowReturnFocusPoint: boolean = false;
    public area: string = "";
    public castType: string = "";
    public cost: string = "";
    public critfailure: string = "";
    public critsuccess: string = "";
    public heightenedDescs: HeightenedDescSet[] = [];
    public desc: string = "";
    //desc2 is displayed after the success levels.
    public desc2: string = "";
    public duration: string = "";
    //When giving conditions to other player creatures, they should last half a round longer to allow for the caster's turn to end after their last.
    // Spells with a duration like "until the end of the target's turn" instead give the caster half a turn longer. This is activated by durationDependsOnTarget.
    public durationDependsOnTarget: boolean = false;
    public failure: string = "";
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public heightened: { variable: string, value: string }[] = [];
    public inputRequired: string = "";
    public levelreq: number = 1;
    public name: string = "";
    //overrideHostile allows you to declare a spell as hostile or friendly regardless of other indicators. This will only change the display color of the spell, but not whether you can target allies.
    public overrideHostile: "hostile" | "friendly" | "" = "";
    public PFSnote: string = "";
    public range: string = "";
    public savingThrow: string = "";
    public shortDesc: string = "";
    public showSpells: SpellCast[] = [];
    public sourceBook: string = "";
    public success: string = "";
    //Sustained spells are deactivated after this time (or permanent with -1, or when resting with -2)
    public sustained: number = 0;
    //target is used internally to determine whether you can cast this spell on yourself, your companion/familiar or any ally
    //Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
    //For "companion", it can only be cast on the companion
    //For "familiar", it can only be cast on the familiar
    //For "self", the spell button will say "Cast", and you are the target
    //For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
    //For "area", it can be cast on any in-app creature witout target number limit or without target
    //For "object", "minion" or "other", the spell button will just say "Cast" without a target
    //Any non-hostile spell can still target allies if the target number is nonzero. Hostile spells can target allies if the target number is nonzero and this.overrideHostile is "friendly".
    public target: string = "self";
    //The target description in the spell description.
    public targets: string = "";
    //If cannotTargetCaster is set, you can't cast the spell on yourself, and you can't select yourself as one of the targets of an ally or area spell.
    //This is needed for emanations (where the spell should give the caster the correct condition in the first place)
    // and spells that exclusively target a different creature (in case of "you and [...]", the caster condition should take care of the caster's part.).
    public cannotTargetCaster: boolean = false;
    public singleTarget: boolean = false;
    public traditions: string[] = [];
    public traits: string[] = [];
    public trigger: string = "";
    public requirements: string = "";
    //The target number determines how many allies you can target with a non-hostile activity, or how many enemies you can target with a hostile one (not actually implemented).
    //The spell can have multiple target numbers that are dependent on the character level and whether you have a feat.
    public targetNumbers: SpellTargetNumber[] = [];
    recast() {
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainConditions.forEach(conditionGain => {
            conditionGain.source = this.name;
        })
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.showSpells = this.showSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.targetNumbers = this.targetNumbers.map(obj => Object.assign(new SpellTargetNumber(), obj).recast());
        return this;
    }
    get_ActivationTraits(): string[] {
        return Array.from(new Set([].concat(...this.castType.split(",")
            .map(castType => {
                const trimmedType = castType.trim().toLowerCase();
                if (trimmedType.includes("verbal")) {
                    return ["Concentrate"];
                } else if (trimmedType.includes("material")) {
                    return ["Manipulate"];
                } else if (trimmedType.includes("somatic")) {
                    return ["Manipulate"];
                } else if (trimmedType.includes("focus")) {
                    return ["Manipulate"];
                } else {
                    return [];
                }
            })
        )))
    }
    get_DescriptionSet(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (this.heightenedDescs.length) {
            for (levelNumber; levelNumber > 0; levelNumber--) {
                if (this.heightenedDescs.some(descSet => descSet.level == levelNumber)) {
                    return this.heightenedDescs.find(descSet => descSet.level == levelNumber);
                }
            }
        }
        return new HeightenedDescSet();
    }
    get_Heightened(text: string, levelNumber: number) {
        //For an arbitrary text (usually the spell description or the saving throw result descriptions), retrieve the appropriate description set for this spell level and replace the variables with the included strings.
        this.get_DescriptionSet(levelNumber).descs.forEach((descVar: HeightenedDesc) => {
            let regex = new RegExp(descVar.variable, "g")
            text = text.replace(regex, (descVar.value || ""));
        })
        return text;
    }
    get_TargetNumber(levelNumber: number, characterService: CharacterService) {
        //You can select any number of targets for an area spell.
        if (this.target == "area") {
            return -1;
        }
        let character = characterService.get_Character();
        let targetNumber: SpellTargetNumber;
        //This descends from levelnumber downwards and returns the first available targetNumber that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        // If no targetNumbers are configured, return 1 for an ally spell and 0 for any other, and if none have a minLevel, return the first that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        if (this.targetNumbers.length) {
            if (this.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
                for (levelNumber; levelNumber > 0; levelNumber--) {
                    if (this.targetNumbers.some(targetNumber => targetNumber.minLevel == levelNumber)) {
                        targetNumber = this.targetNumbers.find(targetNumber => (targetNumber.minLevel == levelNumber) && (targetNumber.featreq && characterService.get_CharacterFeatsTaken(1, character.level, targetNumber.featreq).length));
                        if (!targetNumber) {
                            targetNumber = this.targetNumbers.find(targetNumber => targetNumber.minLevel == levelNumber);
                        }
                        if (targetNumber) {
                            return targetNumber.number;
                        }
                    }
                }
                return this.targetNumbers[0].number;
            } else {
                targetNumber = this.targetNumbers.find(targetNumber => targetNumber.featreq && characterService.get_CharacterFeatsTaken(1, character.level, targetNumber.featreq).length);
                return targetNumber?.number || this.targetNumbers[0].number;
            }
        } else {
            if (this.target == "ally") {
                return 1;
            } else {
                return 0;
            }
        }
    }
    get_HeightenedConditions(levelNumber: number = this.levelreq) {
        //This descends through the level numbers, starting with levelNumber and returning the first set of ConditionGains found with a matching heightenedfilter.
        //If a heightenedFilter is found, the unheightened ConditionGains are returned as well.
        //If there are no ConditionGains with a heightenedFilter, return all.
        if (!this.gainConditions.length || !this.gainConditions.find(gain => gain.heightenedFilter)) {
            return this.gainConditions;
        } else if (this.gainConditions.length) {
            switch (levelNumber) {
                case 10:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 10)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 10); }
                case 9:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 9)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 9); }
                case 8:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 8)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 8); }
                case 7:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 7)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 7); }
                case 6:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 6)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 6); }
                case 5:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 5)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 5); }
                case 4:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 4)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 4); }
                case 3:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 3)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 3); }
                case 2:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 2)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 2); }
                case 1:
                    if (this.gainConditions.some(gain => gain.heightenedFilter == 1)) { return this.gainConditions.filter(gain => !gain.heightenedFilter || gain.heightenedFilter == 1); }
                default:
                    //The spell level might be too low for any of the existing ConditionGains with a heightenedFilter. Return all those without one in that case.
                    return this.gainConditions.filter(gain => !gain.heightenedFilter);
            }
        }
    }
    meetsLevelReq(characterService: CharacterService, spellLevel: number = Math.ceil(characterService.get_Character().level / 2)) {
        //If the spell has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: { met: boolean, desc: string };
        if (this.levelreq && !this.traits.includes("Cantrip")) {
            if (spellLevel >= this.levelreq) {
                result = { met: true, desc: "Level " + this.levelreq };
            } else {
                result = { met: false, desc: "Level " + this.levelreq };
            }
        } else {
            result = { met: true, desc: "" };
        }
        return result;
    }
    canChoose(characterService: CharacterService, spellLevel: number = Math.ceil(characterService.get_Character().level / 2)) {
        if (characterService.still_loading()) { return false }
        if (spellLevel == -1) {
            spellLevel = Math.ceil(characterService.get_Character().level / 2);
        }
        let levelreq: boolean = this.meetsLevelReq(characterService, spellLevel).met;
        return levelreq;
    }
    get_IsHostile(ignoreOverride: boolean = false) {
        //Return whether a spell is meant to be cast on enemies. This is usually the case if the spell target is "other", or if the target is "area" and the spell has no target conditions.
        //Use ignoreOverride to determine whether you can target allies with a spell that is shown as hostile using overideHostile.
        return (
            //If ignoreOverride is false and this spell is overrideHostile as hostile, the spell counts as hostile.
            (!ignoreOverride && this.overrideHostile == "hostile") ||
            //Otherwise, as long as overrides are ignored or no override as friendly exists, keep checking.
            (
                (
                    ignoreOverride ||
                    this.overrideHostile != "friendly"
                ) &&
                (
                    this.target == "other" ||
                    (
                        this.target == "area" && !this.hasTargetConditions()
                    )
                )
            )
        )
    }
    hasTargetConditions() {
        return this.gainConditions.some(gain => gain.targetFilter != "caster");
    }
    public get_EffectiveSpellLevel(context: { baseLevel: number, creature: Creature, gain: SpellGain }, services: { characterService: CharacterService, effectsService: EffectsService }, options: { noEffects?: boolean } = {}): number {
        //Focus spells are automatically heightened to your maximum available spell level.
        let level = context.baseLevel;

        //If needed, calculate the dynamic effective spell level.
        let Character = services.characterService.get_Character();
        if (context.gain.dynamicEffectiveSpellLevel) {
            try {
                level = parseInt(eval(context.gain.dynamicEffectiveSpellLevel));
            } catch (e) {
                console.log("Error parsing effective spell level (" + context.gain.dynamicEffectiveSpellLevel + "): " + e)
            }
        }

        if ([0, -1].includes(level)) {
            level = Character.get_SpellLevel();
        }

        if (!options.noEffects) {
            //Apply all effects that might change the effective spell level of this spell.
            let list = [
                "Spell Levels",
                this.name + " Spell Level"
            ]
            if (this.traditions.includes("Focus")) {
                list.push("Focus Spell Levels");
            }
            if (this.traits.includes("Cantrip")) {
                list.push("Cantrip Spell Levels");
            }
            services.effectsService.get_AbsolutesOnThese(context.creature, list).forEach(effect => {
                if (parseInt(effect.setValue)) {
                    level = parseInt(effect.setValue);
                }
            })
            services.effectsService.get_RelativesOnThese(context.creature, list).forEach(effect => {
                if (parseInt(effect.value)) {
                    level += parseInt(effect.value);
                }
            })
        }

        //If a spell is cast with a lower level than its minimum, the level is raised to the minimum.
        return Math.max(level, (this.levelreq || 0))
    }
}