import { EffectGain } from './EffectGain';
import { ItemGain } from './ItemGain';
import { SpellCast } from './SpellCast';
import { ConditionGain } from './ConditionGain';
import { Hint } from './Hint';
import { CharacterService } from './character.service';
import { Creature } from './Creature';
import { SpellTargetNumber } from './SpellTargetNumber';

export class Activity {
    public actions: string = "1A";
    public activationType: string = "";
    //When activated, the activity will cast this spell. Multiple spells must have the same target or targets.
    public castSpells: SpellCast[] = [];
    public cooldown: number = 0;
    //For Conditions that are toggled, if cooldownAfterEnd is set, the cooldown starts only after the active duration is finished.
    // This is relevant for activities that cannot be used for X time after finishing.
    // All others start ticking down their cooldown as soon as they start.
    public cooldownAfterEnd: boolean = false;
    public cost: string = "";
    public maxDuration: number = 0;
    //When giving conditions to other player creatures, they should last half a round longer to allow for the caster's turn to end after their last.
    // Spells with a duration like "until the end of the target's turn" instead give the caster half a turn longer. This is activated by durationDependsOnTarget.
    public durationDependsOnTarget: boolean = false;
    public sustained: boolean = false;
    //How often can you activate the activity? 0 is one activation per cooldown, or infinite activations if no cooldown is given. Use maxCharges() to read.
    private charges: number = 0;
    public critfailure: string = "";
    public critsuccess: string = "";
    public desc: string = "";
    public failure: string = "";
    public frequency: string = "";
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public hints: Hint[] = [];
    public inputRequired: string = "";
    public name: string = "";
    public onceEffects: EffectGain[] = [];
    public requirements: string = "";
    public showActivities: string[] = [];
    public showSpells: string[] = [];
    public specialdesc: string = "";
    public success: string = "";
    //target is used internally to determine whether you can cast this spell on yourself, your companion/familiar or any ally
    //Should be: "ally", "area", "companion", "familiar", "minion", "object", "other" or "self"
    //For "companion", it can only be cast on the companion
    //For "familiar", it can only be cast on the familiar
    //For "self", the spell button will say "Cast", and you are the target
    //For "ally", it can be cast on any in-app creature (depending on targetNumber) or without target
    //For "area", it can be cast on any in-app creature witout target number limit or without target
    //For "object", "minion" or "other", the spell button will just say "Cast" without a target
    public target: string = "self";
    public targetNumbers: SpellTargetNumber[] = [];
    public toggle: boolean = false;
    public traits: string[] = [];
    public trigger: string = "";
    //If cannotTargetCaster is set, you can't apply the conditions of the activity on yourself, and you can't select yourself as one of the targets of an ally or area activity.
    //This is needed for emanations (where the activity should give the caster the correct condition in the first place)
    // and activities that exclusively target a different creature (in case of "you and [...]", the caster condition should take care of the caster's part.").
    public cannotTargetCaster: boolean = false;
    //$cooldown is a calculated cooldown that it set by get_Cooldown() so that it can be used by can_Activate() without passing parameters.
    public $cooldown: number = 0;
    //Set displayOnly if the activity should not be used, but displayed for information, e.g. for ammunition
    public displayOnly: boolean = false;
    can_Activate() {
        //Test any circumstance under which this can be activated
        let isStance: boolean = (this.traits.includes("Stance"))
        return isStance || this.gainItems.length || this.castSpells.length || this.gainConditions.length || this.cooldown || this.$cooldown || this.toggle || this.onceEffects.length;
    }
    get_IsHostile() {
        //Return whether an activity is meant to be applied on enemies. This is usually the case if the activity target is "other", or if the target is "area" and the activity has no target conditions.
        return (
            this.target == "other" ||
            (
                this.target == "area" && !this.gainConditions.some(gain => gain.targetFilter != "caster")
            )
        )
    }
    get_TargetNumber(levelNumber: number) {
        //You can select any number of targets for an area spell.
        if (this.target == "area") {
            return -1;
        }
        //This descends from levelnumber downwards and returns the first available targetNumber. 1 if no targetNumbers are configured, return 1, and if none have a minLevel, return the first.
        if (this.targetNumbers.length) {
            if (this.targetNumbers.some(targetNumber => targetNumber.minLevel)) {
                for (levelNumber; levelNumber > 0; levelNumber--) {
                    if (this.targetNumbers.some(targetNumber => targetNumber.minLevel == levelNumber)) {
                        return this.targetNumbers.find(targetNumber => targetNumber.minLevel == levelNumber).number;
                    }
                }
                return this.targetNumbers[0].number;
            } else {
                return this.targetNumbers[0].number;
            }
        } else {
            return 1;
        }
    }
    maxCharges(creature: Creature, characterService: CharacterService) {
        //Add any effects to the number of charges you have. If you have none, start with 1, and if the result then remains 1, return 0.
        let charges = this.charges;
        let startWithZero: boolean = false;
        if (charges == 0) {
            startWithZero = true;
            charges = 1;
        }
        characterService.effectsService.get_AbsolutesOnThis(creature, this.name + " Charges")
            .forEach(effect => {
                charges = parseInt(effect.setValue);
            })
        characterService.effectsService.get_RelativesOnThis(creature, this.name + " Charges")
            .forEach(effect => {
                charges += parseInt(effect.value);
            })
        if (startWithZero && charges == 1) {
            return 0;
        } else {
            return charges;
        }
    }
    get_Cooldown(creature: Creature, characterService: CharacterService) {
        //Add any effects to the activity's cooldown.
        let cooldown = this.cooldown;
        //Use get_AbsolutesOnThese() because it allows to prefer lower values. We still sort the effects in descending setValue.
        characterService.effectsService.get_AbsolutesOnThese(creature, [this.name + " Cooldown"], true)
            .sort((a, b) => parseInt(b.setValue) - parseInt(a.setValue))
            .forEach(effect => {
                cooldown = parseInt(effect.setValue);
            })
        //Use get_RelativesOnThese() because it allows to prefer lower values. We still sort the effects in descending value.
        characterService.effectsService.get_RelativesOnThese(creature, [this.name + " Cooldown"], true)
            .sort((a, b) => parseInt(b.value) - parseInt(a.value))
            .forEach(effect => {
                cooldown += parseInt(effect.value);
            })
        //If the cooldown has changed from the original, update all activity gains that refer to this condition to lower their cooldown if necessary.
        this.$cooldown = cooldown;
        if (this.cooldown != cooldown) {
            characterService.get_OwnedActivities(creature, 20, true).filter(gain => gain.name == this.name).forEach(gain => {
                gain.activeCooldown = Math.min(gain.activeCooldown, cooldown);
            })
        }
        return cooldown;
    }
}