import { Item } from './Item'

export class Shield implements Item {
    public notes: string = "";
    public showNotes: boolean = false;
    public raised: boolean = false;
    public takingCover: boolean = false;
    public type: string = "shield";
    public bulk: string = "-";
    public name: string = "";
    public displayName: string = "";
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