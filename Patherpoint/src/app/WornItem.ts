import { Item } from './Item'
import { ItemGain } from './ItemGain';
import { EffectGain } from './EffectGain';

export class WornItem implements Item {
    public notes: string = "";
    public desc: string = "";
    public name: string = "";
    public level: number = 0;
    public price: number = 0;
    public showNotes: boolean = false;
    public showName: boolean = false;
    public type: string = "wornitems";
    public bulk: string = "";
    public displayName: string = "";
    public usage: string = "";
    public equip: boolean = false;
    public equippable: boolean = false;
    public invested: boolean = false;
    public moddable: string = "";
    public potencyRune: number = 0;
    public strikingRune: number = 0;
    public propertyRunes: string[] = [];
    public showon: string = "";
    public hint: string = "";
    public traits: string[] = [];
    public gainActivity: string[] = [];
    public gainItems: ItemGain[] = [];
    public effects: EffectGain[] = [];
    public specialEffects: EffectGain[] = [];
    get_Potency(potency: number) {
        if (potency > 0) {
            return "+"+potency;
        } else {
            return "";
        }
    }
    get_Striking(striking: number) {
        switch (striking) {
            case 0:
                return "";
            case 1:
                return "Striking";
            case 2:
                return "Greater Striking";
            case 3:
                return "Major Striking";
        }
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let potency = this.get_Potency(this.potencyRune);
            let striking = this.get_Striking(this.strikingRune);
            return (potency + " " + (striking + " " + this.name).trim()).trim();
        }
    }
}