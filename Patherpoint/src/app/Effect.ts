export class Effect {
    constructor(
        public type: string = "",
        public target: string = "",
        public value: string = "",
        public source: string = "",
        public penalty: boolean = false,
        public apply: boolean = undefined,
    ) {}
}