import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Hint } from 'src/app/classes/Hint';
import { SpellTargetNumber } from 'src/app/classes/SpellTargetNumber';
import { HeightenedDescSet } from 'src/app/classes/HeightenedDescSet';
import { HeightenedDesc } from 'src/app/classes/HeightenedDesc';

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
