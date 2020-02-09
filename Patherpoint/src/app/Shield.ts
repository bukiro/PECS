import { Item } from './Item'

export class Shield implements Item {
    constructor(
        public type: string = "shield",
        public name: string = "",
        public equip: boolean = false,
        public speedpenalty: number = 0,
        public itembonus: number = 0,
        public coverbonus: number = 0,
        public traits: string[] = [],
        ) {}
}
