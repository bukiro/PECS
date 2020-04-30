export class Effect {
    constructor(
        public creature: string = "",
        public type: string = "",
        public target: string = "",
        public value: string = "",
        public source: string = "",
        public penalty: boolean = false,
        public apply: boolean = undefined,
        public hide: boolean = false
    ) {}
}