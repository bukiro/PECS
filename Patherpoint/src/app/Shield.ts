import { Item } from './Item'

export class Shield implements Item {
    public notes: string = "";
    public desc: string = "";
    public name: string = "";
    public level: string = "-";
    public displayName: string = "";
    public showNotes: boolean = false;
    public showName: boolean = false;
    public raised: boolean = false;
    public takingCover: boolean = false;
    public type: string = "shields";
    public bulk: string = "-";
    public hide: boolean = false;
    public equippable: boolean = true;
    public equip: boolean = false;
    public invested: boolean = false;
    public speedpenalty: number = 0;
    public itembonus: number = 0;
    public coverbonus: number = 0;
    public gainActivity: string[] = [];
    public traits: string[] = [];
    public material: string = "";
    public gainItems = [];
    public effects: string[] = [];
    public specialEffects: string[] = []
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            return this.name;
        }
    }
}