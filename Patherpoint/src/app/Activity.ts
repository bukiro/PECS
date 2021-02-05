import { EffectGain } from './EffectGain';
import { ItemGain } from './ItemGain';
import { SpellCast } from './SpellCast';
import { ConditionGain } from './ConditionGain';
import { Hint } from './Hint';
import { CharacterService } from './character.service';
import { Creature } from './Creature';

export class Activity {
    public actions: string = "1A";
    public activationType: string = "";
    public castSpells: SpellCast[] = [];
    public cooldown: number = 0;
    //For Conditions that are toggled, if cooldownAfterEnd is set, the cooldown starts only after the active duration is finished.
    // This is relevant for activities that cannot be used for X time after finishing.
    // All others start ticking down their cooldown as soon as they start.
    public cooldownAfterEnd: boolean = false;
    public cost: string = "";
    public maxDuration: number = 0;
    public sustained: boolean = false;
    //How often can you activate the activity? 0 is one activation per cooldown, or infinite activations if no cooldown is given. Use maxCharges() to read.
    private charges: number = 0;
    public critfailure: string = "";
    public critsuccess: string = "";
    public desc: string = "";
    public effects: EffectGain[] = [];
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
    public toggle: boolean = false;
    public traits: string[] = [];
    public trigger: string = "";
    //$cooldown is a calculated cooldown that it set by get_Cooldown() so that it can be used by can_Activate() without passing parameters.
    public $cooldown: number = 0;
    //Set displayOnly if the activity should not be used, but displayed for information, e.g. for ammunition
    public displayOnly: boolean = false;
    can_Activate() {
        //Test any circumstance under which this can be activated
        let isStance: boolean = (this.traits.includes("Stance"))
        return isStance || this.gainItems.length || this.castSpells.length || this.gainConditions.length || this.cooldown || this.$cooldown || this.toggle || this.effects.length || this.onceEffects.length;
    }
    maxCharges(creature: Creature, characterService: CharacterService) {
        //Add any effects to the number of charges you have. If you have none, start with 1, and if the result then remains 1, return 0.
        let charges = this.charges;
        let startWithZero: boolean = false;
        if (charges == 0) {
            startWithZero = true;
            charges = 1;
        }
        characterService.effectsService.get_AbsolutesOnThis(creature, this.name+" Charges")
            .forEach(effect => {
                charges = parseInt(effect.setValue);
            })
        characterService.effectsService.get_RelativesOnThis(creature, this.name+" Charges")
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
        characterService.effectsService.get_AbsolutesOnThis(creature, this.name+" Cooldown")
            .forEach(effect => {
                cooldown = parseInt(effect.setValue);
            })
        characterService.effectsService.get_RelativesOnThis(creature, this.name+" Cooldown")
            .forEach(effect => {
                cooldown += parseInt(effect.value);
            })
        this.$cooldown = cooldown;
        return cooldown;
    }
}