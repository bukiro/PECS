export class Effect {
    public ignored: boolean = false;
    constructor(
        public creature: string = "",
        public type: string = "",
        public target: string = "",
        public value: string = "",
        public setValue: string = "",
        public toggle: boolean = false,
        public title: string = "",
        public source: string = "",
        public penalty: boolean = false,
        public apply: boolean = undefined,
        public show: boolean = undefined,
        public duration: number = 0,
        public maxDuration: number = 0,
        //If the effect is typed, cumulative lists all effect sources (of the same type) that it is cumulative with.
        public cumulative: string[] = []
    ) {}
    recast() {
        return this;
    }
}