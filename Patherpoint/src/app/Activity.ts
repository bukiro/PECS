export class Activity {
    public name: string = "";
    public actions: string = "1";
    public activationType: string = "";
    public frequency: string = "";
    public trigger: string = "";
    public requirements: string = "";
    public desc: string = "";
    public critsuccess: string = "";
    public success: string = "";
    public failure: string = "";
    public critfailure: string = "";
    public traits: string[] = [];
    public gainItems = [];
    public showon: string = "";
    public effects: string[] = [];
    public specialEffects: string[] = [];
    get_Actions() {
        switch (this.actions) {
            case "Free":
                return ""
            case "Reaction":
                return "(Reaction)"
            case "1":
                return "(1 Action)"
            case "2":
                return "(2 Actions)"
            case "3":
                return "(3 Actions)"
        }
    }
    can_Activate() {
        let isStance: boolean = (this.traits.indexOf("Stance") > -1)
        return isStance || this.gainItems.length;
    }
}