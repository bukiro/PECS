import { EffectGain } from './EffectGain';
import { ItemGain } from './ItemGain';
import { SpellCast } from './SpellCast';
import { ConditionGain } from './ConditionGain';

export class Activity {
    public name: string = "";
    public desc: string = "";
    public traits: string[] = [];
    public actions: string = "1";
    public activationType: string = "";
    public toggle: boolean = false;
    public cooldown: number = 0;
    public frequency: string = "";
    public trigger: string = "";
    public requirements: string = "";
    public gainItems: ItemGain[] = [];
    public gainConditions: ConditionGain[] = [];
    public castSpells: SpellCast[] = [];
    public critsuccess: string = "";
    public success: string = "";
    public failure: string = "";
    public critfailure: string = "";
    public showon: string = "";
    public hint: string = "";
    public effects: EffectGain[] = [];
    public onceEffects: EffectGain[] = [];
    public inputRequired: string = "";
    get_Actions() {
        switch (this.actions) {
            case "Free":
                return "(Free Action)";
            case "Reaction":
                return "(Reaction)";
            case "1":
                return "(1 Action)";
            case "2":
                return "(2 Actions)";
            case "3":
                return "(3 Actions)";
            default:
                return "("+this.actions+")";
        }
    }
    can_Activate() {
        //Test any circumstance under which this can be activated
        let isStance: boolean = (this.traits.indexOf("Stance") > -1)
        return isStance || this.gainItems.length || this.castSpells.length || this.gainConditions.length || this.cooldown || this.toggle;
    }
}