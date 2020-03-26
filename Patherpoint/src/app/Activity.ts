export class Activity {
    public name: string = "";
    public actions: string = "1";
    public activationType: string = "";
    public frequency: string = "";
    public cooldown: number = 0;
    public trigger: string = "";
    public requirements: string = "";
    public desc: string = "";
    public critsuccess: string = "";
    public success: string = "";
    public failure: string = "";
    public critfailure: string = "";
    public traits: string[] = [];
    public gainItems = [];
    public castSpells: string[] = [];
    public showon: string = "";
    public toggle: boolean = false;
    public effects = [];
    public specialEffects = [];
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
        return isStance || this.gainItems.length || this.castSpells.length || this.cooldown;
    }
}