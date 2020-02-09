import { Item } from './Item'

export class Weapon implements Item {
    constructor(
        public type: string = "weapon",
        public name: string = "",
        public equip: boolean = false,
        public level: number = 0,
        public prof: string = "",
        public dmgType: string = "",
        public dicenum: number = 1,
        public dicesize: number = 6,
        public melee: number = 0,
        public ranged: number = 0,
        public itembonus: number = 0,
        public moddable: boolean = true,
        public traits: string[] = [],
    ) {}
}
