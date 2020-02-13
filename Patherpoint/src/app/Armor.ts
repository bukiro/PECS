import { Item } from './Item'

export class Armor implements Item {
    public notes: string = "";
    public showNotes: boolean = false;
    constructor(
        public type: string = "armor",
        public name: string = "",
        public equip: boolean = false,
        public level: number = 0,
        public prof: string = "",
        public dexcap: number = 999,
        public skillpenalty: number = 0,
        public speedpenalty: number = 0,
        public strength: number = 0,
        public itembonus: number = 0,
        public moddable: boolean = true,
        public traits: string[] = [],
        public potencyRune:number = 0,
        public resilientRune:number = 0,
        public propertyRunes:string[] = [],
        public material: string = "",
        public effects: string[] = []
        ) {}
}