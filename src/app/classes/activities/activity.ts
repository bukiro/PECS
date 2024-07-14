import { Observable, of, combineLatest, map } from 'rxjs';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ConditionGain } from '../conditions/condition-gain';
import { Creature } from '../creatures/creature';
import { EffectGain } from '../effects/effect-gain';
import { Hint } from '../hints/hint';
import { ItemGain } from '../items/item-gain';
import { HeightenedDescriptionVariableCollection } from '../spells/heightened-description-variable-collection';
import { SpellCast } from '../spells/spell-cast';
import { SpellTargetNumber } from '../spells/spell-target-number';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ActivityTargetOption } from './activity-target-options';
import { HeightenedDescriptionVariable } from '../spells/heightened-description-variable';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Activity>({
    primitives: [
        'actions',
        'activationType',
        'cooldown',
        'cooldownAfterEnd',
        'cost',
        'maxDuration',
        'durationDependsOnTarget',
        'sourceBook',
        'sustained',
        'charges',
        'critfailure',
        'critsuccess',
        'desc',
        'failure',
        'frequency',
        'inputRequired',
        'name',
        'iconTitleOverride',
        'iconValueOverride',
        'overrideHostile',
        'requirements',
        'showonSkill',
        'specialdesc',
        'success',
        'target',
        'toggle',
        'trigger',
        'cannotTargetCaster',
        'displayOnly',
    ],
    primitiveArrays: [
        'showActivities',
        'traits',
    ],
    serializableArrays: {
        castSpells:
            () => obj => SpellCast.from(obj),
        gainConditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        gainItems:
            () => obj => ItemGain.from(obj),
        heightenedDescs:
            () => obj => HeightenedDescriptionVariableCollection.from(obj),
        hints:
            () => obj => Hint.from(obj),
        onceEffects:
            () => obj => EffectGain.from(obj),
        showSpells:
            () => obj => SpellCast.from(obj),
        targetNumbers:
            () => obj => SpellTargetNumber.from(obj),
    },
});

export class Activity implements Serializable<Activity> {
    public actions = '';
    public activationType = '';
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
     * 0 is one activation per cooldown, or infinite activations if no cooldown is given.
     */
    public charges = 0;
    public critfailure = '';
    public critsuccess = '';
    public desc = '';
    public failure = '';
    public frequency = '';
    public inputRequired = '';
    public name = '';
    public iconTitleOverride = '';
    public iconValueOverride = '';
    /**
     * overrideHostile allows you to declare a spell as hostile or friendly regardless of other indicators.
     * This will only change the display color of the spell, but not whether you can target allies.
     */
    public overrideHostile: 'hostile' | 'friendly' | '' = '';
    public requirements = '';
    public showonSkill = '';
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
    public target: ActivityTargetOption = ActivityTargetOption.Self;
    public toggle = false;
    public trigger = '';
    /**
     * If cannotTargetCaster is set, you can't apply the conditions of the activity on yourself,
     * and you can't select yourself as one of the targets of an ally or area activity.
     * This is needed for emanations (where the activity should give the caster the correct condition in the first place)
     * and activities that exclusively target a different creature.
     * (In case of "you and [...]", the caster condition should take care of the caster's part.)
     */
    public cannotTargetCaster = false;
    //Set displayOnly if the activity should not be used, but displayed for information, e.g. for ammunition
    public displayOnly = false;

    public showActivities: Array<string> = [];
    public traits: Array<string> = [];

    /**
     * When activated, the activity will cast this spell. Multiple spells must have the same target or targets.
     */
    public castSpells: Array<SpellCast> = [];
    public gainConditions: Array<ConditionGain> = [];
    public gainItems: Array<ItemGain> = [];
    public heightenedDescs: Array<HeightenedDescriptionVariableCollection> = [];
    public hints: Array<Hint> = [];
    public onceEffects: Array<EffectGain> = [];
    public showSpells: Array<SpellCast> = [];
    /**
     * The target number determines how many allies you can target with a non-hostile activity,
     * or how many enemies you can target with a hostile one (not actually implemented).
     * The activity can have multiple target numbers that are dependent on the character level and whether you have a feat.
     */
    public targetNumbers: Array<SpellTargetNumber> = [];

    /**
     * effectiveCooldownByCreature$ is a map of calculated cooldown observables matched to creatures
     * created by the ActivityPropertiesService so that it can be subscribed to without passing parameters.
     */
    public readonly effectiveCooldownByCreature$ = new Map<string, Observable<number>>();
    /**
     * effectiveMaxChargesByCreature$ is a map of calculated cooldown observables matched to creatures
     * created by the ActivityPropertiesService so that it can be subscribed to without passing parameters.
     */
    public readonly effectiveMaxChargesByCreature$ = new Map<string, Observable<number>>();

    public static from(values: DeepPartial<Activity>, recastFns: RecastFns): Activity {
        return new Activity().with(values, recastFns);
    }

    public with(values: DeepPartial<Activity>, recastFns: RecastFns): Activity {
        assign(this, values, recastFns);

        this.gainConditions.forEach(gain => gain.source = this.name);

        if (this.sustained) {
            const defaultSustainDuration = TimePeriods.TenMinutes;

            this.toggle = true;

            if (!this.maxDuration) {
                this.maxDuration = defaultSustainDuration;
            }
        }

        return this;
    }

    public forExport(): DeepPartial<Activity> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Activity {
        return Activity.from(this, recastFns);
    }

    public isEqual(compared: Partial<Activity>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public clearTemporaryValues(): Activity {
        this.effectiveCooldownByCreature$.clear();
        this.effectiveMaxChargesByCreature$.clear();

        return this;
    }

    public activationTraits(): Array<string> {
        return Array.from(new Set(
            new Array<string>()
                .concat(...this.activationType.split(',')
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
                    }),
                ),
        ));
    }

    public canActivate$(creature: Creature): Observable<boolean> {
        // Test whether activating this activity would make any difference in the app.
        // Does not test whether it is currently available.
        return (
            this.traits.includes('Stance')
            || !!this.gainItems.length
            || !!this.castSpells.length
            || !!this.gainConditions.length
            || !!this.charges
            || !!this.cooldown
            || !!this.onceEffects.length
            || this.toggle
        )
            ? of(true)
            : combineLatest([
                this.effectiveMaxChargesByCreature$.get(creature.id) ?? of(0),
                this.effectiveCooldownByCreature$.get(creature.id) ?? of(0),
            ])
                .pipe(
                    map(([charges, cooldown]) =>
                        !!charges
                        || !!cooldown,
                    ),
                );

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
                    this.target === ActivityTargetOption.Other ||
                    (
                        this.target === ActivityTargetOption.Area && !this._hasTargetConditions()
                    )
                )
            )
        );
    }

    public heightenedText(text: string, levelNumber: number): string {
        // For an arbitrary text (usually the activity description or the saving throw result descriptions),
        // retrieve the appropriate description set for this level and replace the variables with the included strings.
        let heightenedText = text;

        this._effectiveDescriptionSet(levelNumber).descs.forEach((descVar: HeightenedDescriptionVariable) => {
            const regex = new RegExp(descVar.variable, 'g');

            heightenedText = heightenedText.replace(regex, (descVar.value || ''));
        });

        return heightenedText;
    }

    private _effectiveDescriptionSet(levelNumber: number): HeightenedDescriptionVariableCollection {
        //This descends from levelnumber downwards and returns the first description set with a matching level.
        //A description set contains variable names and the text to replace them with.
        if (this.heightenedDescs.length) {
            let remainingLevelNumber = levelNumber;

            for (remainingLevelNumber; remainingLevelNumber > 0; remainingLevelNumber--) {
                const foundDesc = this.heightenedDescs.find(descSet => descSet.level === remainingLevelNumber);

                if (foundDesc) {
                    return foundDesc;
                }
            }
        }

        return new HeightenedDescriptionVariableCollection();
    }

    private _hasTargetConditions(): boolean {
        return this.gainConditions.some(gain => gain.targetFilter !== 'caster');
    }
}
