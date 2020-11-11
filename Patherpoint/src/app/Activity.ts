import { EffectGain } from './EffectGain';
import { ItemGain } from './ItemGain';
import { SpellCast } from './SpellCast';
import { ConditionGain } from './ConditionGain';

export class Activity {
    public actions: string = "1A";
    public activationType: string = "";
    public castSpells: SpellCast[] = [];
    public cooldown: number = 0;
    public cost: string = "";
    public maxDuration: number = 0;
    public sustained: boolean = false;
    public charges: number = 0;
    public critfailure: string = "";
    public critsuccess: string = "";
    public desc: string = "";
    public effects: EffectGain[] = [];
    public failure: string = "";
    public frequency: string = "";
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public hint: string = "";
    public inputRequired: string = "";
    public name: string = "";
    public onceEffects: EffectGain[] = [];
    public requirements: string = "";
    public showon: string = "";
    public showSpells: string[] = [];
    public specialdesc: string = "";
    public success: string = "";
    public toggle: boolean = false;
    public traits: string[] = [];
    public trigger: string = "";
    //Set displayOnly if the activity should not be used, but displayed for information, e.g. for ammunition
    public displayOnly: boolean = false;
    can_Activate() {
        //Test any circumstance under which this can be activated
        let isStance: boolean = (this.traits.includes("Stance"))
        return isStance || this.gainItems.length || this.castSpells.length || this.gainConditions.length || this.cooldown || this.toggle || this.effects.length || this.onceEffects.length;
    }
}