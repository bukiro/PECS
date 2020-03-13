import { Item } from './Item'

export class WornItem implements Item {
    public notes: string = "";
    public showNotes: boolean = false;
    public showName: boolean = false;
    public type: string = "wornitem";
    public bulk: string = "-";
    public name: string = "";
    public displayName: string = "";
    public usage: string = "";
    public equip: boolean = false;
    public equippable: boolean = false;
    public invested: boolean = false;
    public moddable: string = "";
    public potencyRune: number = 0;
    public strikingRune: number = 0;
    public propertyRunes: string[] = [];
    public gainActivity: string[] = [];
    public traits: string[] = [];
    public effects: string[] = [];
    public specialEffects: string[] = []
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