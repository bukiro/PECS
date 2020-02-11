import { Level } from './Level';

export class Class {
    constructor (
        public name: string = "",
        public keyAbilities: string[] = [],
        public keyAbility: string = "",
        public levels: Level[] = []
    ) { }
}