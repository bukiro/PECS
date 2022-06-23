import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Hint } from 'src/app/classes/Hint';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';
import { EffectsService } from 'src/app/services/effects.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';

export enum ActivityTargetOptions {
    Companion = 'companion',
    Familiar = 'familiar',
    Self = 'self',
    Ally = 'ally',
    Area = 'area',
    Object = 'object',
    Minion = 'minion',
    Other = 'other',
    Null = '',
}

export class Activity {
    public readonly isActivity: boolean = true;
    public actions = '';
    public activationType = '';
    /**
     * When activated, the activity will cast this spell. Multiple spells must have the same target or targets.
     */
    public castSpells: Array<SpellCast> = [];
    public cooldown = 0;
    /**
     * For Conditions that are toggled, if cooldownAfterEnd is set, the cooldown starts only after the active duration is finished.
     * This is relevant for activities that cannot be used for X time after finishing.
     * All others start ticking down their cooldown as soon as they start.
     */
    public cooldownAfterEnd = false;
    public cost = '';
    public maxDuration = 0;
    /**
     * When giving conditions to other player creatures,
     * they should last half a round longer to allow for the caster's turn to end after their last.
     * Spells with a duration like "until the end of the target's turn" instead give the caster half a turn longer.
     * This is activated by durationDependsOnTarget.
     */
    public durationDependsOnTarget = false;
    public sourceBook = '';
    /**
     * The activity still needs to have toggle=true and a maxDuration set for sustaining to work.
     * This is ensured automatically in the recast method.
     */
    public sustained = false;
    /**
     * How often can you activate the activity?
     * 0 is one activation per cooldown, or infinite activations if no cooldown is given. Use maxCharges() to read.
     */
    public charges = 0;
    public critfailure = '';
    public critsuccess = '';
    public heightenedDescs: Array<HeightenedDescSet> = [];
    public desc = '';
    public failure = '';
    public frequency = '';
    public gainConditions: Array<ConditionGain> = [];
    public gainItems: Array<ItemGain> = [];
    public hints: Array<Hint> = [];
    public inputRequired = '';
    public name = '';
    public iconTitleOverride = '';
    public iconValueOverride = '';
    public onceEffects: Array<EffectGain> = [];
    /**
     * overrideHostile allows you to declare a spell as hostile or friendly regardless of other indicators.
     * This will only change the display color of the spell, but not whether you can target allies.
     */
    public overrideHostile: 'hostile' | 'friendly' | '' = '';
    public requirements = '';
    public showActivities: Array<string> = [];
    public showonSkill = '';
    public showSpells: Array<SpellCast> = [];
    public specialdesc = '';
    public success = '';
    /**
     * target is used internally to determine whether you can cast this spell on yourself, your companion/familiar or any ally
     * Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
     * - For "companion", it can only be cast on the companion
     * - For "familiar", it can only be cast on the familiar
     * - For "self", the spell button will say "Cast", and you are the target
     * - For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
     * - For "area", it can be cast on any in-app creature witout target number limit or without target
     * - For "object", "minion" or "other", the spell button will just say "Activate" without a target
     * Any non-hostile activity can still target allies if the target number is nonzero.
     * Hostile activities can target allies if the target number is nonzero and this.overrideHostile is "friendly".
     */
    public target: ActivityTargetOptions = ActivityTargetOptions.Self;
    /**
     * The target number determines how many allies you can target with a non-hostile activity,
     * or how many enemies you can target with a hostile one (not actually implemented).
     * The activity can have multiple target numbers that are dependent on the character level and whether you have a feat.
     */
    public targetNumbers: Array<SpellTargetNumber> = [];
    public toggle = false;
    public traits: Array<string> = [];
    public trigger = '';
    /**
     * If cannotTargetCaster is set, you can't apply the conditions of the activity on yourself,
     * and you can't select yourself as one of the targets of an ally or area activity.
     * This is needed for emanations (where the activity should give the caster the correct condition in the first place)
     * and activities that exclusively target a different creature.
     * (In case of "you and [...]", the caster condition should take care of the caster's part.)
     */
    public cannotTargetCaster = false;
    /**
     * _cooldown is a calculated cooldown that is set by get_Cooldown() so that it can be used by can_Activate() without passing parameters.
     */
    public $cooldown = 0;
    /**
     * _charges is the calculated number of charges that is set by maxCharges()
     * so that it can be used by can_Activate() without passing parameters.
     */
    public $charges = 0;
    //Set displayOnly if the activity should not be used, but displayed for information, e.g. for ammunition
    public displayOnly = false;
    public recast(): Activity {
        this.castSpells = this.castSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.heightenedDescs = this.heightenedDescs.map(obj => Object.assign(new HeightenedDescSet(), obj).recast());
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.gainConditions.forEach(conditionGain => {
            conditionGain.source = this.name;
        });
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.showSpells = this.showSpells.map(obj => Object.assign(new SpellCast(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.onceEffects = this.onceEffects.map(obj => Object.assign(new EffectGain(), obj).recast());
        this.targetNumbers = this.targetNumbers.map(obj => Object.assign(new SpellTargetNumber(), obj).recast());

        if (this.sustained) {
            const defaultSustainDuration = 1000;

            this.toggle = true;

            if (!this.maxDuration) {
                this.maxDuration = defaultSustainDuration;
            }
        }

        return this;
    }
    public activationTraits(): Array<string> {
        return Array.from(new Set([].concat(...this.activationType.split(',')
            .map(activationType => {
                const trimmedType = activationType.trim().toLowerCase();

                if (trimmedType.includes('command')) {
                    return ['Auditory', 'Concentrate'];
                } else if (trimmedType.includes('envision')) {
                    return ['Concentrate'];
                } else if (trimmedType.includes('interact')) {
                    return ['Manipulate'];
                } else if (trimmedType.includes('concentrate')) {
                    return ['Concentrate'];
                } else {
                    return [];
                }
            }))),
        );
    }
    public canActivate(): boolean {
        //Test any circumstance under which this can be activated
        return (this.traits.includes('Stance')) ||
            !!this.gainItems.length ||
            !!this.castSpells.length ||
            !!this.gainConditions.length ||
            !!this.charges ||
            !!this.$charges ||
            !!this.cooldown ||
            !!this.$cooldown ||
            this.toggle ||
            !!this.onceEffects.length;
    }
    public isHostile(ignoreOverride = false): boolean {
        //Return whether an activity is meant to be applied on enemies.
        //This is usually the case if the activity target is "other", or if the target is "area" and the activity has no target conditions.
        //Use ignoreOverride to determine whether you can target allies with an activity that is shown as hostile using overideHostile.
        return (
            //If ignoreOverride is false and this activity is overrideHostile as hostile, the activity counts as hostile.
            (!ignoreOverride && this.overrideHostile === 'hostile') ||
            //Otherwise, as long as overrides are ignored or no override as friendly exists, keep checking.
            (
                (
                    ignoreOverride ||
                    this.overrideHostile !== 'friendly'
                ) &&
                (
                    this.target === ActivityTargetOptions.Other ||
                    (
                        this.target === ActivityTargetOptions.Area && !this._hasTargetConditions()
                    )
                )
            )
        );
    }
    public allowedTargetNumber(levelNumber: number, characterService: CharacterService): number {
        //You can select any number of targets for an area spell.
        if (this.target === ActivityTargetOptions.Area) {
            return -1;
        }

        const character = characterService.character;
        let targetNumberResult: SpellTargetNumber;

        // This descends from levelnumber downwards and returns the first available targetNumber that has the required feat (if any).
        // Prefer targetNumbers with required feats over those without.
        // If no targetNumbers are configured, return 1 for an ally activity and 0 for any other, and if none have a minLevel,
        // return the first that has the required feat (if any). Prefer targetNumbers with required feats over those without.
        if (this.targetNumbers.length) {
            if (this.targetNumbers.some(targetNumber => !!targetNumber.minLevel)) {
                let remainingLevelNumber = levelNumber;

                for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                    if (this.targetNumbers.some(targetNumber => targetNumber.minLevel === remainingLevelNumber)) {
                        targetNumberResult =
                            this.targetNumbers.find(targetNumber =>
                                (targetNumber.minLevel === remainingLevelNumber) &&
                                (
                                    targetNumber.featreq &&
                                    characterService.characterFeatsTaken(1, character.level, { featName: targetNumber.featreq }).length
                                ));

                        if (!targetNumberResult) {
                            targetNumberResult = this.targetNumbers.find(targetNumber => targetNumber.minLevel === remainingLevelNumber);
                        }

                        if (targetNumberResult) {
                            return targetNumberResult.number;
                        }
                    }
                }

                return this.targetNumbers[0].number;
            } else {
                targetNumberResult =
                    this.targetNumbers.find(targetNumber =>
                        targetNumber.featreq &&
                        !!characterService.characterFeatsTaken(1, character.level, { featName: targetNumber.featreq }).length,
                    );

                return targetNumberResult?.number || this.targetNumbers[0].number;
            }
        } else {
            if (this.target === ActivityTargetOptions.Ally) {
                return 1;
            } else {
                return 0;
            }
        }
    }
    public maxCharges(context: { creature: Creature }, services: { effectsService: EffectsService }): number {
        //Add any effects to the number of charges you have. If you have none, start with 1, and if the result then remains 1, return 0.
        let charges = this.charges;
        let isStartingWithZero = false;

        if (charges === 0) {
            isStartingWithZero = true;
            charges = 1;
        }

        services.effectsService.absoluteEffectsOnThis(context.creature, `${ this.name } Charges`)
            .forEach(effect => {
                charges = parseInt(effect.setValue, 10);
            });
        services.effectsService.relativeEffectsOnThis(context.creature, `${ this.name } Charges`)
            .forEach(effect => {
                charges += parseInt(effect.value, 10);
            });

        if (isStartingWithZero && charges === 1) {
            this.$charges = 0;

            return 0;
        } else {
            this.$charges = charges;

            return charges;
        }
    }
    public effectiveCooldown(
        context: { creature: Creature },
        services: { characterService: CharacterService; effectsService: EffectsService },
    ): number {
        //Add any effects to the activity's cooldown.
        let cooldown = this.cooldown;

        //Use get_AbsolutesOnThese() because it allows to prefer lower values. We still sort the effects in descending setValue.
        services.effectsService.absoluteEffectsOnThese(context.creature, [`${ this.name } Cooldown`], { lowerIsBetter: true })
            .sort((a, b) => parseInt(b.setValue, 10) - parseInt(a.setValue, 10))
            .forEach(effect => {
                cooldown = parseInt(effect.setValue, 10);
            });
        //Use get_RelativesOnThese() because it allows to prefer lower values. We still sort the effects in descending value.
        services.effectsService.relativeEffectsOnThese(context.creature, [`${ this.name } Cooldown`], { lowerIsBetter: true })
            .sort((a, b) => parseInt(b.value, 10) - parseInt(a.value, 10))
            .forEach(effect => {
                cooldown += parseInt(effect.value, 10);
            });
        this.$cooldown = cooldown;

        // If the cooldown has changed from the original,
        // update all activity gains that refer to this condition to lower their cooldown if necessary.
        if (this.cooldown !== cooldown) {
            services.characterService.creatureOwnedActivities(context.creature, Defaults.maxCharacterLevel, true)
                .filter(gain => gain.name === this.name)
                .forEach(gain => {
                    gain.activeCooldown = Math.min(gain.activeCooldown, cooldown);
                });
        }

        return cooldown;
    }
    public heightenedText(text: string, levelNumber: number): string {
        // For an arbitrary text (usually the activity description or the saving throw result descriptions),
        // retrieve the appropriate description set for this level and replace the variables with the included strings.
        let heightenedText = text;

        this._effectiveDescriptionSet(levelNumber).descs.forEach((descVar: HeightenedDesc) => {
            const regex = new RegExp(descVar.variable, 'g');

            heightenedText = heightenedText.replace(regex, (descVar.value || ''));
        });

        return heightenedText;
    }
    private _effectiveDescriptionSet(levelNumber: number): HeightenedDescSet {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (this.heightenedDescs.length) {
            let remainingLevelNumber = levelNumber;

            for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                if (this.heightenedDescs.some(descSet => descSet.level === remainingLevelNumber)) {
                    return this.heightenedDescs.find(descSet => descSet.level === remainingLevelNumber);
                }
            }
        }

        return new HeightenedDescSet();
    }
    private _hasTargetConditions(): boolean {
        return this.gainConditions.some(gain => gain.targetFilter !== 'caster');
    }
}
