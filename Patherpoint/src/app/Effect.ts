export class Effect {
    constructor(
        public creature: string = "",
        public type: string = "",
        public target: string = "",
        public value: string = "",
        public setValue: string = "",
        public toggle: boolean = false,
        public source: string = "",
        public penalty: boolean = false,
        public apply: boolean = undefined,
        public hide: boolean = false,
        public duration: number = 0
    ) {}
}